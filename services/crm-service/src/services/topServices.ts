import prisma from '../utils/prisma';

export interface ChangeTOPRequest {
  new_top_days: number;
  effective_date?: string | null; // ISO date string or null for immediate
  reason: string;
  request_for_approval?: boolean;
}

export interface ApproveTOPRequest {
  history_id: string;
  approved: boolean; // true = approve, false = reject
  rejection_reason?: string;
}

/**
 * Change customer TOP (Terms of Payment)
 * Supports immediate change, scheduled change, and approval workflow
 */
export const changeTOPService = async (
  customerId: string,
  userId: string,
  data: ChangeTOPRequest
) => {
  const { new_top_days, effective_date, reason, request_for_approval } = data;

  // Validation
  if (new_top_days < 0 || new_top_days > 365) {
    throw new Error('TOP days must be between 0 and 365');
  }

  if (!reason || reason.trim().length < 5) {
    throw new Error('Reason must be at least 5 characters');
  }

  // Get current customer data
  const customer = await prisma.customers.findUnique({
    where: { id: customerId },
    select: { top_days: true, customer_name: true },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  const old_top_days = customer.top_days;

  // Parse effective date
  const effectiveDate = effective_date ? new Date(effective_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine status based on request type
  let status: 'PENDING' | 'APPROVED' | 'SCHEDULED' = 'APPROVED';
  let shouldUpdateCustomer = false;

  if (request_for_approval) {
    // User is requesting approval
    status = 'PENDING';
    shouldUpdateCustomer = false;
  } else if (effectiveDate && effectiveDate > today) {
    // Scheduled for future date
    status = 'SCHEDULED';
    shouldUpdateCustomer = false;
  } else {
    // Immediate change (effective today or no date specified)
    status = 'APPROVED';
    shouldUpdateCustomer = true;
  }

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create history record
    const history = await tx.customer_top_history.create({
      data: {
        customer_id: customerId,
        old_top_days,
        new_top_days,
        changed_by: userId,
        effective_date: effectiveDate,
        reason: reason.trim(),
        status,
        approved_by: status === 'APPROVED' ? userId : null,
        approved_at: status === 'APPROVED' ? new Date() : null,
      },
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
            code: true,
          },
        },
        changed_by_user: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
    });

    // Update customer if immediate
    if (shouldUpdateCustomer) {
      await tx.customers.update({
        where: { id: customerId },
        data: {
          top_days: new_top_days,
          updatedAt: new Date(),
        },
      });
    }

    return history;
  });

  return {
    success: true,
    status,
    message:
      status === 'PENDING'
        ? 'TOP change request submitted for approval'
        : status === 'SCHEDULED'
        ? `TOP change scheduled for ${effectiveDate?.toISOString().split('T')[0]}`
        : 'TOP updated successfully',
    data: result,
  };
};

/**
 * Approve or reject a pending TOP change request
 */
export const approveTOPChangeService = async (
  historyId: string,
  approverId: string,
  data: ApproveTOPRequest
) => {
  const { approved, rejection_reason } = data;

  // Get the history record
  const history = await prisma.customer_top_history.findUnique({
    where: { id: historyId },
    include: {
      customer: true,
    },
  });

  if (!history) {
    throw new Error('TOP change request not found');
  }

  if (history.status !== 'PENDING') {
    throw new Error(`Cannot approve/reject request with status: ${history.status}`);
  }

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    if (approved) {
      // Approve: update customer and history
      await tx.customers.update({
        where: { id: history.customer_id },
        data: {
          top_days: history.new_top_days,
          updatedAt: new Date(),
        },
      });

      const updatedHistory = await tx.customer_top_history.update({
        where: { id: historyId },
        data: {
          status: 'APPROVED',
          approved_by: approverId,
          approved_at: new Date(),
        },
        include: {
          customer: {
            select: {
              id: true,
              customer_name: true,
              code: true,
            },
          },
          changed_by_user: {
            select: {
              id: true,
              email: true,
              employee: {
                select: {
                  full_name: true,
                },
              },
            },
          },
          approved_by_user: {
            select: {
              id: true,
              email: true,
              employee: {
                select: {
                  full_name: true,
                },
              },
            },
          },
        },
      });

      return { approved: true, history: updatedHistory };
    } else {
      // Reject: update history only
      const updatedHistory = await tx.customer_top_history.update({
        where: { id: historyId },
        data: {
          status: 'REJECTED',
          approved_by: approverId,
          approved_at: new Date(),
          reference_id: rejection_reason || 'Rejected',
        },
        include: {
          customer: {
            select: {
              id: true,
              customer_name: true,
              code: true,
            },
          },
          changed_by_user: {
            select: {
              id: true,
              email: true,
              employee: {
                select: {
                  full_name: true,
                },
              },
            },
          },
          approved_by_user: {
            select: {
              id: true,
              email: true,
              employee: {
                select: {
                  full_name: true,
                },
              },
            },
          },
        },
      });

      return { approved: false, history: updatedHistory };
    }
  });

  return {
    success: true,
    message: approved ? 'TOP change approved successfully' : 'TOP change rejected',
    data: result,
  };
};

/**
 * Get TOP change history for a customer
 */
export const getTOPHistoryService = async (
  customerId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [history, total] = await Promise.all([
    prisma.customer_top_history.findMany({
      where: { customer_id: customerId },
      include: {
        changed_by_user: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                full_name: true,
              },
            },
          },
        },
        approved_by_user: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        changed_at: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.customer_top_history.count({
      where: { customer_id: customerId },
    }),
  ]);

  return {
    data: history,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Apply scheduled TOP changes (to be run by cron job)
 * Applies all SCHEDULED changes where effective_date <= today
 */
export const applyScheduledTOPChangesService = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all scheduled changes that should be applied today
  const scheduledChanges = await prisma.customer_top_history.findMany({
    where: {
      status: 'SCHEDULED',
      effective_date: {
        lte: today,
      },
    },
    include: {
      customer: true,
    },
  });

  const results = [];

  for (const change of scheduledChanges) {
    try {
      await prisma.$transaction(async (tx) => {
        // Update customer TOP
        await tx.customers.update({
          where: { id: change.customer_id },
          data: {
            top_days: change.new_top_days,
            updatedAt: new Date(),
          },
        });

        // Update history status
        await tx.customer_top_history.update({
          where: { id: change.id },
          data: {
            status: 'APPROVED',
            approved_at: new Date(),
            reference_id: 'SYSTEM_SCHEDULED',
          },
        });
      });

      results.push({
        success: true,
        customer_id: change.customer_id,
        customer_name: change.customer.customer_name,
        old_top: change.old_top_days,
        new_top: change.new_top_days,
      });
    } catch (error) {
      results.push({
        success: false,
        customer_id: change.customer_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    processed: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
};
