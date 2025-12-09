import prisma from '../utils/prisma';

export enum ApprovalStatus {
  DRAFT = 'DRAFT',
  PENDING_L1 = 'PENDING_L1',
  PENDING_L2 = 'PENDING_L2',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ApprovalAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Get approval thresholds to determine required approval levels
 */
export async function getApprovalThresholds() {
  return await prisma.approvalThreshold.findMany({
    orderBy: { min_amount: 'asc' },
  });
}

/**
 * Determine required approval level based on PO amount
 */
export async function determineApprovalLevel(amount: number): Promise<number> {
  const thresholds = await getApprovalThresholds();
  
  // Find the highest level needed for this amount
  let requiredLevel = 1;
  
  for (const threshold of thresholds) {
    const minAmount = Number(threshold.min_amount);
    const maxAmount = threshold.max_amount ? Number(threshold.max_amount) : Infinity;
    
    if (amount >= minAmount && amount <= maxAmount) {
      if (threshold.approval_level > requiredLevel) {
        requiredLevel = threshold.approval_level;
      }
    }
  }
  
  return requiredLevel;
}

/**
 * Submit PO for approval
 */
export async function submitPOForApproval(poId: string, submittedBy: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    select: { 
      id: true, 
      total_amount: true, 
      approval_status: true,
      status: true,
    },
  });

  if (!po) {
    throw new Error('Purchase Order not found');
  }

  if (po.approval_status !== 'DRAFT') {
    throw new Error('PO can only be submitted from DRAFT status');
  }

  if (po.status === 'CANCELLED') {
    throw new Error('Cannot submit cancelled PO for approval');
  }

  const totalAmount = Number(po.total_amount);
  const requiredLevel = await determineApprovalLevel(totalAmount);

  // Update PO status to pending first level approval
  const updatedPO = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      approval_status: ApprovalStatus.PENDING_L1,
      submitted_for_approval_at: new Date(),
      submitted_by: submittedBy,
    },
    include: {
      items: true,
      rfp: true,
      creator: {
        select: {
          id: true,
          email: true,
          employee: {
            select: { full_name: true },
          },
        },
      },
    },
  });

  return {
    po: updatedPO,
    required_approval_level: requiredLevel,
  };
}

/**
 * Approve PO
 */
export async function approvePO(
  poId: string,
  approverId: string,
  comments?: string
) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      approval_logs: {
        orderBy: { created_at: 'desc' },
      },
    },
  });

  if (!po) {
    throw new Error('Purchase Order not found');
  }

  if (po.approval_status === ApprovalStatus.APPROVED) {
    throw new Error('PO is already approved');
  }

  if (po.approval_status === ApprovalStatus.REJECTED) {
    throw new Error('Cannot approve rejected PO');
  }

  if (po.approval_status === ApprovalStatus.DRAFT) {
    throw new Error('PO must be submitted for approval first');
  }

  const totalAmount = Number(po.total_amount);
  const requiredLevel = await determineApprovalLevel(totalAmount);
  
  // Determine current approval level based on current status
  let currentLevel = 1;
  if (po.approval_status === ApprovalStatus.PENDING_L1) {
    currentLevel = 1;
  } else if (po.approval_status === ApprovalStatus.PENDING_L2) {
    currentLevel = 2;
  }

  // Check if this approver has appropriate role
  const approver = await prisma.users.findUnique({
    where: { id: approverId },
    select: { roles: true },
  });

  if (!approver) {
    throw new Error('Approver not found');
  }

  // Validate approver role - only CEO can approve
  const canApprove = approver.roles.some((role: string) => 
    ['CEO'].includes(role)
  );

  if (!canApprove) {
    throw new Error('Only CEO can approve PO. Current roles: ' + approver.roles.join(', '));
  }

  // Determine next status
  let nextStatus: ApprovalStatus;
  let approvedAt: Date | null = null;
  let approvedBy: string | null = null;

  if (currentLevel >= requiredLevel) {
    // Final approval
    nextStatus = ApprovalStatus.APPROVED;
    approvedAt = new Date();
    approvedBy = approverId;
  } else {
    // Move to next level
    nextStatus = ApprovalStatus.PENDING_L2;
  }

  // Update PO and create approval log in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create approval log
    await tx.approvalLog.create({
      data: {
        po_id: poId,
        approver_id: approverId,
        approver_level: currentLevel,
        action: ApprovalAction.APPROVED,
        comments: comments || null,
      },
    });

    // Update PO
    const updatedPO = await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        approval_status: nextStatus,
        approved_at: approvedAt,
        approved_by: approvedBy,
      },
      include: {
        items: true,
        rfp: true,
        approval_logs: {
          include: {
            approver: {
              select: {
                id: true,
                email: true,
                employee: {
                  select: { full_name: true },
                },
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    return updatedPO;
  });

  return result;
}

/**
 * Reject PO
 */
export async function rejectPO(
  poId: string,
  rejecterId: string,
  comments: string
) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
  });

  if (!po) {
    throw new Error('Purchase Order not found');
  }

  if (po.approval_status === ApprovalStatus.APPROVED) {
    throw new Error('Cannot reject approved PO');
  }

  if (po.approval_status === ApprovalStatus.REJECTED) {
    throw new Error('PO is already rejected');
  }

  if (po.approval_status === ApprovalStatus.DRAFT) {
    throw new Error('PO must be submitted for approval first');
  }

  // Determine current approval level
  let currentLevel = 1;
  if (po.approval_status === ApprovalStatus.PENDING_L1) {
    currentLevel = 1;
  } else if (po.approval_status === ApprovalStatus.PENDING_L2) {
    currentLevel = 2;
  }

  // Update PO and create approval log in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create approval log
    await tx.approvalLog.create({
      data: {
        po_id: poId,
        approver_id: rejecterId,
        approver_level: currentLevel,
        action: ApprovalAction.REJECTED,
        comments: comments || 'Rejected',
      },
    });

    // Update PO
    const updatedPO = await tx.purchaseOrder.update({
      where: { id: poId },
      data: {
        approval_status: ApprovalStatus.REJECTED,
        rejected_at: new Date(),
        rejected_by: rejecterId,
      },
      include: {
        items: true,
        rfp: true,
        approval_logs: {
          include: {
            approver: {
              select: {
                id: true,
                email: true,
                employee: {
                  select: { full_name: true },
                },
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    return updatedPO;
  });

  return result;
}

// Removed sendPOToVendor function
// PO sending is done manually by procurement team outside the system
// After approval, user can download PDF and send it manually

/**
 * Get POs pending approval for specific user based on their role
 */
export async function getPendingApprovalsForUser(userId: string) {
  try {
    console.log('[Approval Service] Getting pending approvals for user:', userId);
    
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    if (!user) {
      console.log('[Approval Service] User not found:', userId);
      throw new Error('User not found');
    }

    console.log('[Approval Service] User roles:', user.roles);

    // Only CEO can see pending approvals
    const canApprove = user.roles.some((role: string) => 
      ['CEO'].includes(role)
    );

    console.log('[Approval Service] Can approve:', canApprove);

    if (!canApprove) {
      console.log('[Approval Service] User does not have CEO role, returning empty array');
      return [];
    }

    // Get all POs pending approval (L1 and L2)
    const pendingStatuses: ApprovalStatus[] = [
      ApprovalStatus.PENDING_L1,
      ApprovalStatus.PENDING_L2,
    ];

    console.log('[Approval Service] Fetching POs with statuses:', pendingStatuses);

    const pos = await prisma.purchaseOrder.findMany({
    where: {
      approval_status: {
        in: pendingStatuses,
      },
    },
    include: {
      items: {
        select: {
          id: true,
        },
      },
      rfp: {
        select: {
          id: true,
          rfp_number: true,
          project_name: true,
        },
      },
      creator: {
        select: {
          id: true,
          email: true,
          employee: {
            select: { full_name: true },
          },
        },
      },
    },
    orderBy: { submitted_for_approval_at: 'asc' },
  });

  console.log('[Approval Service] Found', pos.length, 'pending POs');
  return pos;
  } catch (error: any) {
    console.error('[Approval Service] Error in getPendingApprovalsForUser:', error);
    console.error('[Approval Service] Error stack:', error.stack);
    throw error;
  }
}
