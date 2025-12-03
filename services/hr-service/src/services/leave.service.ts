import { getPrisma } from '../utils/prisma';

/**
 * Request body for creating a new leave request
 * Note: duration_days from request body maps to total_days in database
 */
interface CreateLeaveRequest {
  leave_type: string;
  start_date: Date;
  end_date: Date;
  duration_days: number; // This will be saved as total_days in DB
  reason: string;
}

interface UpdateLeaveStatus {
  status: 'APPROVED' | 'REJECTED';
  approved_by: string;
  rejection_reason?: string;
}

export class LeaveService {
  private prisma = getPrisma();

  /**
   * Create a new leave request
   */
  async createLeaveRequest(employeeId: string, data: CreateLeaveRequest) {
    return await this.prisma.hr_leave_requests.create({
      data: {
        employee_id: employeeId,
        leave_type: data.leave_type as any,
        start_date: data.start_date,
        end_date: data.end_date,
        total_days: data.duration_days, // Field di database adalah total_days
        reason: data.reason,
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
          },
        },
      },
    });
  }

  /**
   * Get all leave requests for an employee
   */
  async getEmployeeLeaves(employeeId: string, status?: string) {
    const where: any = { employee_id: employeeId };
    if (status) {
      where.status = status;
    }

    return await this.prisma.hr_leave_requests.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Get all leave requests (for HR/Manager)
   */
  async getAllLeaves(filters?: { status?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.hr_leave_requests.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              full_name: true,
              position: true,
              department: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.hr_leave_requests.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get leave request by ID
   */
  async getLeaveById(id: string) {
    return await this.prisma.hr_leave_requests.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
          },
        },
      },
    });
  }

  /**
   * Update leave request status (approve/reject)
   */
  async updateLeaveStatus(id: string, data: UpdateLeaveStatus) {
    return await this.prisma.hr_leave_requests.update({
      where: { id },
      data: {
        status: data.status,
        approved_by: data.approved_by,
        approved_at: data.status === 'APPROVED' ? new Date() : undefined,
        rejection_reason: data.rejection_reason,
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
          },
        },
      },
    });
  }

  /**
   * Cancel leave request
   */
  async cancelLeave(id: string, employeeId: string) {
    const leave = await this.prisma.hr_leave_requests.findUnique({
      where: { id },
    });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.employee_id !== employeeId) {
      throw new Error('Unauthorized');
    }

    if (leave.status !== 'PENDING') {
      throw new Error('Only pending requests can be cancelled');
    }

    return await this.prisma.hr_leave_requests.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }
}
