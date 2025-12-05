import { getPrisma } from '../utils/prisma';

const prisma = getPrisma();

/**
 * Get all pending requests untuk manager/atasan langsung
 * Berdasarkan manager_id di tabel employees
 */
export const getTeamRequests = async (managerId: string) => {
  try {
    // Ambil leave requests dari anak buah (semua status untuk history)
    const leaveRequests = await prisma.hr_leave_requests.findMany({
      where: {
        employee: {
          manager_id: managerId
        }
        // Removed status filter to get all requests (PENDING, APPROVED, REJECTED)
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Ambil permission requests dari anak buah
    // Commented out - hr_permission_requests table doesn't exist yet
    const permissionRequests: any[] = [];
    // const permissionRequests = await prisma.hr_permission_requests.findMany({
    //   where: {
    //     employee: {
    //       manager_id: managerId
    //     }
    //   },
    //   include: {
    //     employee: {
    //       select: {
    //         id: true,
    //         full_name: true,
    //         position: true,
    //         department: true
    //       }
    //     }
    //   },
    //   orderBy: {
    //     created_at: 'desc'
    //   }
    // });

    // Ambil overtime requests dari anak buah
    // Commented out - hr_overtime_requests table doesn't exist yet
    const overtimeRequests: any[] = [];
    // const overtimeRequests = await prisma.hr_overtime_requests.findMany({
    //   where: {
    //     employee: {
    //       manager_id: managerId
    //     }
    //   },
    //   include: {
    //     employee: {
    //       select: {
    //         id: true,
    //         full_name: true,
    //         position: true,
    //         department: true
    //       }
    //     }
    //   },
    //   orderBy: {
    //     created_at: 'desc'
    //   }
    // });

    // Ambil reimbursement requests dari anak buah
    // Commented out - hr_reimbursement_requests table doesn't exist yet
    const reimbursementRequests: any[] = [];
    // const reimbursementRequests = await prisma.hr_reimbursement_requests.findMany({
    //   where: {
    //     employee: {
    //       manager_id: managerId
    //     }
    //   },
    //   include: {
    //     employee: {
    //       select: {
    //         id: true,
    //         full_name: true,
    //         position: true,
    //         department: true
    //       }
    //     }
    //   },
    //   orderBy: {
    //     created_at: 'desc'
    //   }
    // });

    return {
      leave_requests: leaveRequests,
      permission_requests: permissionRequests,
      overtime_requests: overtimeRequests,
      reimbursement_requests: reimbursementRequests,
      total: leaveRequests.length + permissionRequests.length + overtimeRequests.length + reimbursementRequests.length
    };
  } catch (error) {
    console.error('Error in getTeamRequests:', error);
    throw new Error('Failed to fetch team requests');
  }
};

/**
 * Get ALL pending requests untuk HR Admin
 * Tanpa filter manager_id (company-wide)
 */
export const getAllRequests = async () => {
  try {
    const leaveRequests = await prisma.hr_leave_requests.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
            manager: {
              select: {
                full_name: true,
                position: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return {
      leave_requests: leaveRequests,
      permission_requests: [],
      overtime_requests: [],
      reimbursement_requests: [],
      total: leaveRequests.length
    };
  } catch (error) {
    console.error('Error in getAllRequests:', error);
    throw new Error('Failed to fetch all requests');
  }
};

/**
 * Approve leave request
 */
export const approveLeaveRequest = async (requestId: string, approvedBy: string) => {
  try {
    const updated = await prisma.hr_leave_requests.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approved_by: approvedBy,
        approved_at: new Date()
      },
      include: {
        employee: {
          select: {
            full_name: true,
            position: true
          }
        }
      }
    });

    return updated;
  } catch (error) {
    console.error('Error approving leave request:', error);
    throw new Error('Failed to approve leave request');
  }
};

/**
 * Reject leave request
 */
export const rejectLeaveRequest = async (requestId: string, rejectedBy: string, rejectionReason: string) => {
  try {
    const updated = await prisma.hr_leave_requests.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejection_reason: rejectionReason
      }
    });

    return updated;
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    throw new Error('Failed to reject leave request');
  }
};

/**
 * Approve permission request
 * Commented out - hr_permission_requests table doesn't exist yet
 */
export const approvePermissionRequest = async (requestId: string, approvedBy: string) => {
  throw new Error('Permission requests not implemented yet');
  // try {
  //   const updated = await prisma.hr_permission_requests.update({
  //     where: { id: requestId },
  //     data: {
  //       status: 'APPROVED',
  //       approved_by: approvedBy,
  //       approved_at: new Date()
  //     }
  //   });
  //   return updated;
  // } catch (error) {
  //   console.error('Error approving permission request:', error);
  //   throw new Error('Failed to approve permission request');
  // }
};

/**
 * Reject permission request
 * Commented out - hr_permission_requests table doesn't exist yet
 */
export const rejectPermissionRequest = async (requestId: string, rejectedBy: string, rejectionReason: string) => {
  throw new Error('Permission requests not implemented yet');
  // try {
  //   const updated = await prisma.hr_permission_requests.update({
  //     where: { id: requestId },
  //     data: {
  //       status: 'REJECTED',
  //       rejection_reason: rejectionReason
  //     }
  //   });
  //   return updated;
  // } catch (error) {
  //   console.error('Error rejecting permission request:', error);
  //   throw new Error('Failed to reject permission request');
  // }
};

/**
 * Approve overtime request
 * Commented out - hr_overtime_requests table doesn't exist yet
 */
export const approveOvertimeRequest = async (requestId: string, approvedBy: string) => {
  throw new Error('Overtime requests not implemented yet');
  // try {
  //   const updated = await prisma.hr_overtime_requests.update({
  //     where: { id: requestId },
  //     data: {
  //       status: 'APPROVED',
  //       approved_by: approvedBy,
  //       approved_at: new Date()
  //     }
  //   });
  //   return updated;
  // } catch (error) {
  //   console.error('Error approving overtime request:', error);
  //   throw new Error('Failed to approve overtime request');
  // }
};

/**
 * Reject overtime request
 * Commented out - hr_overtime_requests table doesn't exist yet
 */
export const rejectOvertimeRequest = async (requestId: string, rejectedBy: string, rejectionReason: string) => {
  throw new Error('Overtime requests not implemented yet');
  // try {
  //   const updated = await prisma.hr_overtime_requests.update({
  //     where: { id: requestId },
  //     data: {
  //       status: 'REJECTED',
  //       rejection_reason: rejectionReason
  //     }
  //   });
  //   return updated;
  // } catch (error) {
  //   console.error('Error rejecting overtime request:', error);
  //   throw new Error('Failed to reject overtime request');
  // }
};

/**
 * Approve reimbursement request
 * Commented out - hr_reimbursement_requests table doesn't exist yet
 */
export const approveReimbursementRequest = async (requestId: string, approvedBy: string) => {
  throw new Error('Reimbursement requests not implemented yet');
};

/**
 * Reject reimbursement request
 * Commented out - hr_reimbursement_requests table doesn't exist yet
 */
export const rejectReimbursementRequest = async (requestId: string, rejectedBy: string, rejectionReason: string) => {
  throw new Error('Reimbursement requests not implemented yet');
};

/**
 * Check if user has subordinates (is a manager)
 * Note: employees table doesn't have manager_id field, so always return false
 */
export const checkHasSubordinates = async (employeeId: string) => {
  try {
    // Env-based override: allow specific employees as approvers
    // Set HR_APPROVER_IDS as comma-separated employee IDs
    const approverIdsEnv = process.env.HR_APPROVER_IDS || '';
    const approverIds = approverIdsEnv
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (approverIds.includes(employeeId)) {
      return { has_subordinates: true, count: 1 };
    }

    // employees table doesn't have manager_id field, return false otherwise
    return { has_subordinates: false, count: 0 };
  } catch (error) {
    console.error('Error checking subordinates:', error);
    throw new Error('Failed to check subordinates');
  }
};
