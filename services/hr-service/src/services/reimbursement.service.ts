import { getPrisma } from '../utils/prisma';

interface CreateReimbursementRequest {
  reimbursement_type: string;
  claim_date: Date;
  amount: number;
  currency?: string;
  description: string;
  receipt_file?: string;
}

interface UpdateReimbursementStatus {
  status: 'APPROVED' | 'REJECTED';
  approved_by: string;
  rejection_reason?: string;
}

export class ReimbursementService {
  private prisma = getPrisma();

  /**
   * Create a new reimbursement request
   */
  async createReimbursementRequest(employeeId: string, data: CreateReimbursementRequest) {
    return await this.prisma.hr_reimbursement_requests.create({
      data: {
        employee_id: employeeId,
        reimbursement_type: data.reimbursement_type as any,
        claim_date: data.claim_date,
        amount: data.amount,
        currency: data.currency || 'IDR',
        description: data.description,
        receipt_file: data.receipt_file,
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
   * Get all reimbursement requests for an employee
   */
  async getEmployeeReimbursements(employeeId: string, status?: string) {
    const where: any = { employee_id: employeeId };
    if (status) {
      where.status = status;
    }

    return await this.prisma.hr_reimbursement_requests.findMany({
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
        claim_date: 'desc',
      },
    });
  }

  /**
   * Get all reimbursement requests (for HR/Manager)
   */
  async getAllReimbursements(filters?: { status?: string; page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.hr_reimbursement_requests.findMany({
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
      this.prisma.hr_reimbursement_requests.count({ where }),
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
   * Get reimbursement request by ID
   */
  async getReimbursementById(id: string) {
    return await this.prisma.hr_reimbursement_requests.findUnique({
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
   * Update reimbursement request status (approve/reject)
   */
  async updateReimbursementStatus(id: string, data: UpdateReimbursementStatus) {
    return await this.prisma.hr_reimbursement_requests.update({
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
   * Mark reimbursement as paid
   */
  async markReimbursementPaid(id: string) {
    const reimbursement = await this.prisma.hr_reimbursement_requests.findUnique({
      where: { id },
    });

    if (!reimbursement) {
      throw new Error('Reimbursement request not found');
    }

    if (reimbursement.status !== 'APPROVED') {
      throw new Error('Only approved requests can be marked as paid');
    }

    return await this.prisma.hr_reimbursement_requests.update({
      where: { id },
      data: {
        paid_at: new Date(),
      },
    });
  }

  /**
   * Cancel reimbursement request
   */
  async cancelReimbursement(id: string, employeeId: string) {
    const reimbursement = await this.prisma.hr_reimbursement_requests.findUnique({
      where: { id },
    });

    if (!reimbursement) {
      throw new Error('Reimbursement request not found');
    }

    if (reimbursement.employee_id !== employeeId) {
      throw new Error('Unauthorized');
    }

    if (reimbursement.status !== 'PENDING') {
      throw new Error('Only pending requests can be cancelled');
    }

    return await this.prisma.hr_reimbursement_requests.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  /**
   * Get reimbursement summary (useful for finance)
   */
  async getReimbursementSummary(filters?: { month?: string; employeeId?: string }) {
    const where: any = {
      status: 'APPROVED',
    };

    if (filters?.month) {
      const [year, monthNum] = filters.month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);
      where.claim_date = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (filters?.employeeId) {
      where.employee_id = filters.employeeId;
    }

    const reimbursements = await this.prisma.hr_reimbursement_requests.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    // Calculate totals by type
    const byType: { [key: string]: { count: number; total: number } } = {};

    reimbursements.forEach((r: any) => {
      if (!byType[r.reimbursement_type]) {
        byType[r.reimbursement_type] = { count: 0, total: 0 };
      }
      byType[r.reimbursement_type].count++;
      byType[r.reimbursement_type].total += Number(r.amount);
    });

    const totalAmount = reimbursements.reduce((sum: number, r: any) => sum + Number(r.amount), 0);
    const paidCount = reimbursements.filter((r: any) => r.paid_at).length;
    const unpaidCount = reimbursements.length - paidCount;

    return {
      period: filters?.month || 'all',
      total_requests: reimbursements.length,
      total_amount: totalAmount,
      paid_count: paidCount,
      unpaid_count: unpaidCount,
      by_type: byType,
    };
  }
}
