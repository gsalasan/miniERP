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
    const permissionRequests = await prisma.hr_permission_requests.findMany({
      where: {
        employee: {
          manager_id: managerId
        }
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

    // Ambil overtime requests dari anak buah
    const overtimeRequests = await prisma.hr_overtime_requests.findMany({
      where: {
        employee: {
          manager_id: managerId
        }
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

    // Ambil reimbursement requests dari anak buah
    const reimbursementRequests = await prisma.hr_reimbursement_requests.findMany({
      where: {
        employee: {
          manager_id: managerId
        }
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

    const permissionRequests = await prisma.hr_permission_requests.findMany({
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

    const overtimeRequests = await prisma.hr_overtime_requests.findMany({
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

    const reimbursementRequests = await prisma.hr_reimbursement_requests.findMany({
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
      permission_requests: permissionRequests,
      overtime_requests: overtimeRequests,
      reimbursement_requests: reimbursementRequests,
      total: leaveRequests.length + permissionRequests.length + overtimeRequests.length + reimbursementRequests.length
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
 */
export const approvePermissionRequest = async (requestId: string, approvedBy: string) => {
  try {
    const updated = await prisma.hr_permission_requests.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approved_by: approvedBy,
        approved_at: new Date()
      }
    });

    return updated;
  } catch (error) {
    console.error('Error approving permission request:', error);
    throw new Error('Failed to approve permission request');
  }
};

/**
 * Reject permission request
 */
export const rejectPermissionRequest = async (requestId: string, rejectedBy: string, rejectionReason: string) => {
  try {
    const updated = await prisma.hr_permission_requests.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejection_reason: rejectionReason
      }
    });

    return updated;
  } catch (error) {
    console.error('Error rejecting permission request:', error);
    throw new Error('Failed to reject permission request');
  }
};

/**
 * Approve overtime request
 */
export const approveOvertimeRequest = async (requestId: string, approvedBy: string) => {
  try {
    const updated = await prisma.hr_overtime_requests.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approved_by: approvedBy,
        approved_at: new Date()
      }
    });

    return updated;
  } catch (error) {
    console.error('Error approving overtime request:', error);
    throw new Error('Failed to approve overtime request');
  }
};

/**
 * Reject overtime request
 */
export const rejectOvertimeRequest = async (requestId: string, rejectedBy: string, rejectionReason: string) => {
  try {
    const updated = await prisma.hr_overtime_requests.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejection_reason: rejectionReason
      }
    });

    return updated;
  } catch (error) {
    console.error('Error rejecting overtime request:', error);
    throw new Error('Failed to reject overtime request');
  }
};

/**
 * Approve reimbursement request
 */
export const approveReimbursementRequest = async (requestId: string, approvedBy: string) => {
  try {
    const updated = await prisma.hr_reimbursement_requests.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approved_by: approvedBy,
        approved_at: new Date()
      }
    });

    return updated;
  } catch (error) {
    console.error('Error approving reimbursement request:', error);
    throw new Error('Failed to approve reimbursement request');
  }
};

/**
 * Reject reimbursement request
 */
export const rejectReimbursementRequest = async (requestId: string, rejectedBy: string, rejectionReason: string) => {
  try {
    const updated = await prisma.hr_reimbursement_requests.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejection_reason: rejectionReason
      }
    });

    return updated;
  } catch (error) {
    console.error('Error rejecting reimbursement request:', error);
    throw new Error('Failed to reject reimbursement request');
  }
};

/**
 * Check if user has subordinates (is a manager)
 */
export const checkHasSubordinates = async (employeeId: string) => {
  try {
    const count = await prisma.employees.count({
      where: { manager_id: employeeId }
    });

    return { has_subordinates: count > 0, count };
  } catch (error) {
    console.error('Error checking subordinates:', error);
    throw new Error('Failed to check subordinates');
  }
};
