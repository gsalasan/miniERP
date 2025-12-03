import { getPrisma } from '../utils/prisma';

interface CreateOvertimeRequest {
  overtime_code: 'L1' | 'L2' | 'L3' | 'L4';
  overtime_date: Date;
  start_time: Date;
  end_time: Date;
  duration_hours: number;
  description: string;
}

interface UpdateOvertimeStatus {
  status: 'APPROVED' | 'REJECTED';
  approved_by: string;
  rejection_reason?: string;
}

export class OvertimeService {
  private prisma = getPrisma();

  /**
   * Create a new overtime request
   * L1: Lembur Weekday 8 jam
   * L2: Lembur Weekday 4 jam
   * L3: Lembur Weekend 8 jam
   * L4: Lembur Weekend 4 jam
   */
  async createOvertimeRequest(employeeId: string, data: CreateOvertimeRequest) {
    // Validate overtime code and duration
    this.validateOvertimeCode(data.overtime_code, data.duration_hours);

    // Convert overtime_date to proper Date object if it's a string
    const overtimeDate = typeof data.overtime_date === 'string' 
      ? new Date(data.overtime_date) 
      : data.overtime_date;

    return await this.prisma.hr_overtime_requests.create({
      data: {
        employee_id: employeeId,
        overtime_code: data.overtime_code,
        overtime_date: overtimeDate,
        start_time: data.start_time,
        end_time: data.end_time,
        duration_hours: data.duration_hours,
        description: data.description,
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
   * Validate overtime code matches expected duration
   */
  private validateOvertimeCode(code: string, hours: number) {
    const codeMap: { [key: string]: number } = {
      L1: 8, // Weekday 8 jam
      L2: 4, // Weekday 4 jam
      L3: 8, // Weekend 8 jam
      L4: 4, // Weekend 4 jam
    };

    const expectedHours = codeMap[code];
    if (!expectedHours) {
      throw new Error(`Invalid overtime code: ${code}`);
    }

    // Allow some tolerance (e.g., 7.5-8.5 hours for 8-hour code)
    const tolerance = 0.5;
    if (Math.abs(hours - expectedHours) > tolerance) {
      throw new Error(
        `Duration mismatch: ${code} expects ${expectedHours} hours but got ${hours} hours`
      );
    }
  }

  /**
   * Get all overtime requests for an employee
   */
  async getEmployeeOvertimes(employeeId: string, status?: string) {
    const where: any = { employee_id: employeeId };
    if (status) {
      where.status = status;
    }

    return await this.prisma.hr_overtime_requests.findMany({
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
        overtime_date: 'desc',
      },
    });
  }

  /**
   * Get all overtime requests (for HR/Manager)
   */
  async getAllOvertimes(filters?: { status?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.hr_overtime_requests.findMany({
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
      this.prisma.hr_overtime_requests.count({ where }),
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
   * Get overtime request by ID
   */
  async getOvertimeById(id: string) {
    return await this.prisma.hr_overtime_requests.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Update overtime request status (approve/reject)
   */
  async updateOvertimeStatus(id: string, data: UpdateOvertimeStatus) {
    return await this.prisma.hr_overtime_requests.update({
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
   * Cancel overtime request
   */
  async cancelOvertime(id: string, employeeId: string) {
    const overtime = await this.prisma.hr_overtime_requests.findUnique({
      where: { id },
    });

    if (!overtime) {
      throw new Error('Overtime request not found');
    }

    if (overtime.employee_id !== employeeId) {
      throw new Error('Unauthorized');
    }

    if (overtime.status !== 'PENDING') {
      throw new Error('Only pending requests can be cancelled');
    }

    return await this.prisma.hr_overtime_requests.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  /**
   * Get overtime summary for an employee (useful for payroll)
   */
  async getOvertimeSummary(employeeId: string, month: string) {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const overtimes = await this.prisma.hr_overtime_requests.findMany({
      where: {
        employee_id: employeeId,
        status: 'APPROVED',
        overtime_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by overtime code
    const summary = {
      L1: { count: 0, total_hours: 0 },
      L2: { count: 0, total_hours: 0 },
      L3: { count: 0, total_hours: 0 },
      L4: { count: 0, total_hours: 0 },
    };

    overtimes.forEach((ot: any) => {
      const code = ot.overtime_code as 'L1' | 'L2' | 'L3' | 'L4';
      summary[code].count++;
      summary[code].total_hours += Number(ot.duration_hours);
    });

    return {
      month,
      employee_id: employeeId,
      summary,
      total_overtime_hours: Object.values(summary).reduce((sum, s) => sum + s.total_hours, 0),
    };
  }
}
