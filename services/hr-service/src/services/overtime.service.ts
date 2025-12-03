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
    const overtime = await this.prisma.hr_overtime_requests.findUnique({
      where: { id },
    });

    if (!overtime) {
      throw new Error('Overtime request not found');
    }

    // Calculate amount if approved
    let calculatedAmount = null;
    let approvedHours = null;
    let calculationMeta = null;

    if (data.status === 'APPROVED') {
      const calculation = this.calculateOvertimeAmount(
        overtime.overtime_code as 'L1' | 'L2' | 'L3' | 'L4',
        Number(overtime.duration_hours)
      );
      
      calculatedAmount = calculation.amount;
      approvedHours = calculation.approved_hours;
      calculationMeta = calculation.meta;
    }

    return await this.prisma.hr_overtime_requests.update({
      where: { id },
      data: {
        status: data.status,
        approved_by: data.approved_by,
        approved_at: data.status === 'APPROVED' ? new Date() : undefined,
        rejection_reason: data.rejection_reason,
        approved_hours: approvedHours,
        calculated_amount: calculatedAmount,
        calculation_meta: calculationMeta as any,
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
   * Calculate overtime amount based on overtime code
   * L1 & L3: Rp 250,000
   * L2 & L4: Rp 100,000
   */
  private calculateOvertimeAmount(
    overtimeCode: 'L1' | 'L2' | 'L3' | 'L4',
    durationHours: number
  ) {
    const rates: { [key: string]: number } = {
      L1: 250000, // Weekday 8 jam
      L2: 100000, // Weekday 4 jam
      L3: 250000, // Weekend 8 jam
      L4: 100000, // Weekend 4 jam
    };

    const ratePerSession = rates[overtimeCode];
    const amount = ratePerSession;

    return {
      amount,
      approved_hours: durationHours,
      meta: {
        overtime_code: overtimeCode,
        rate_per_session: ratePerSession,
        duration_hours: durationHours,
        calculation_date: new Date().toISOString(),
        calculation_note: `${overtimeCode} = Rp ${ratePerSession.toLocaleString('id-ID')} per session`,
      },
    };
  }

  /**
   * Calculate overtime amount for existing approved request
   * Useful for recalculation or batch processing
   */
  async calculateAndUpdateAmount(id: string) {
    const overtime = await this.prisma.hr_overtime_requests.findUnique({
      where: { id },
    });

    if (!overtime) {
      throw new Error('Overtime request not found');
    }

    if (overtime.status !== 'APPROVED') {
      throw new Error('Only approved overtime can be calculated');
    }

    const calculation = this.calculateOvertimeAmount(
      overtime.overtime_code as 'L1' | 'L2' | 'L3' | 'L4',
      Number(overtime.duration_hours)
    );

    return await this.prisma.hr_overtime_requests.update({
      where: { id },
      data: {
        approved_hours: calculation.approved_hours,
        calculated_amount: calculation.amount,
        calculation_meta: calculation.meta as any,
        status: 'CALCULATED',
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
        status: { in: ['APPROVED', 'CALCULATED'] },
        overtime_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by overtime code
    const summary = {
      L1: { count: 0, total_hours: 0, total_amount: 0 },
      L2: { count: 0, total_hours: 0, total_amount: 0 },
      L3: { count: 0, total_hours: 0, total_amount: 0 },
      L4: { count: 0, total_hours: 0, total_amount: 0 },
    };

    const rates = {
      L1: 250000,
      L2: 100000,
      L3: 250000,
      L4: 100000,
    };

    overtimes.forEach((ot: any) => {
      const code = ot.overtime_code as 'L1' | 'L2' | 'L3' | 'L4';
      summary[code].count++;
      summary[code].total_hours += Number(ot.duration_hours);
      
      // Use calculated_amount if available, otherwise calculate
      const amount = ot.calculated_amount 
        ? Number(ot.calculated_amount) 
        : rates[code];
      summary[code].total_amount += amount;
    });

    const totalAmount = Object.values(summary).reduce((sum, s) => sum + s.total_amount, 0);
    const totalHours = Object.values(summary).reduce((sum, s) => sum + s.total_hours, 0);

    return {
      month,
      employee_id: employeeId,
      summary,
      total_overtime_hours: totalHours,
      total_overtime_amount: totalAmount,
      breakdown: {
        L1_L3: (summary.L1.total_amount + summary.L3.total_amount),
        L2_L4: (summary.L2.total_amount + summary.L4.total_amount),
      },
    };
  }
}
