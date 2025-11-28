import { getPrisma } from '../utils/prisma';

interface CreatePermissionRequest {
  permission_type: string;
  start_time: Date;
  end_time: Date;
  duration_hours: number;
  reason: string;
}

interface UpdatePermissionStatus {
  status: 'APPROVED' | 'REJECTED';
  approved_by: string;
  rejection_reason?: string;
}

export class PermissionService {
  private prisma = getPrisma();

  /**
   * Create a new permission request
   */
  async createPermissionRequest(employeeId: string, data: CreatePermissionRequest) {
    return await this.prisma.hr_permission_requests.create({
      data: {
        employee_id: employeeId,
        permission_type: data.permission_type as any,
        start_time: data.start_time,
        end_time: data.end_time,
        duration_hours: data.duration_hours,
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
   * Get all permission requests for an employee
   */
  async getEmployeePermissions(employeeId: string, status?: string) {
    const where: any = { employee_id: employeeId };
    if (status) {
      where.status = status;
    }

    return await this.prisma.hr_permission_requests.findMany({
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
   * Get all permission requests (for HR/Manager)
   */
  async getAllPermissions(filters?: { status?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.hr_permission_requests.findMany({
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
      this.prisma.hr_permission_requests.count({ where }),
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
   * Get permission request by ID
   */
  async getPermissionById(id: string) {
    return await this.prisma.hr_permission_requests.findUnique({
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
   * Update permission request status (approve/reject)
   */
  async updatePermissionStatus(id: string, data: UpdatePermissionStatus) {
    return await this.prisma.hr_permission_requests.update({
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
   * Cancel permission request
   */
  async cancelPermission(id: string, employeeId: string) {
    const permission = await this.prisma.hr_permission_requests.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new Error('Permission request not found');
    }

    if (permission.employee_id !== employeeId) {
      throw new Error('Unauthorized');
    }

    if (permission.status !== 'PENDING') {
      throw new Error('Only pending requests can be cancelled');
    }

    return await this.prisma.hr_permission_requests.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }
}
