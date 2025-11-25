import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DiscountPolicy {
  id: string;
  role: string;
  authorityLimit: number;
  maxDiscountLimit: number;
  description?: string;
}

class DiscountApprovalServices {
  /**
   * Request discount approval from CEO
   * Validates discount against policies
   */
  async requestDiscountApproval(
    estimationId: string,
    userId: string,
    requestedDiscount: number
  ) {
    // Get estimation
    const estimation = await prisma.estimations.findUnique({
      where: { id: estimationId },
      include: {
        projects: {
          include: {
            customer: true,
          },
        },
        users_estimations_requested_by_user_idTousers: true,
      },
    });

    if (!estimation) {
      throw new Error('Estimasi tidak ditemukan');
    }

    // Get user to check role
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    // Get discount policy for user's highest role
    const policy = await this.getDiscountPolicyForUser(user.roles);

    if (!policy) {
      throw new Error('Kebijakan diskon tidak ditemukan untuk role Anda');
    }

    // Validate discount
    if (requestedDiscount <= policy.authorityLimit) {
      throw new Error(
        `Diskon ${requestedDiscount}% tidak perlu approval. Anda memiliki wewenang hingga ${policy.authorityLimit}%.`
      );
    }

    if (requestedDiscount > policy.maxDiscountLimit) {
      throw new Error(
        `Diskon ${requestedDiscount}% melebihi batas maksimal ${policy.maxDiscountLimit}% untuk role Anda.`
      );
    }

    // Update estimation status
    const updated = await prisma.estimations.update({
      where: { id: estimationId },
      data: {
        status: 'PENDING_DISCOUNT_APPROVAL',
        requested_discount: requestedDiscount,
        requested_by_user_id: userId,
        discount_requested_at: new Date(),
      },
    });

    // TODO: Send notification to CEO (mock for now)
    console.log(`[NOTIFICATION] Discount approval request sent to CEO for estimation ${estimationId}`);

    return {
      id: updated.id,
      status: updated.status,
      requested_discount: updated.requested_discount,
      message: 'Permintaan approval diskon telah dikirim ke CEO',
    };
  }

  /**
   * CEO decides on discount approval
   */
  async decideDiscount(
    estimationId: string,
    ceoUserId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) {
    // Get estimation
    const estimation = await prisma.estimations.findUnique({
      where: { id: estimationId },
      include: {
        projects: {
          include: {
            customer: true,
          },
        },
        users_estimations_requested_by_user_idTousers: true,
      },
    });

    if (!estimation) {
      throw new Error('Estimasi tidak ditemukan');
    }

    if (estimation.status !== 'PENDING_DISCOUNT_APPROVAL') {
      throw new Error('Estimasi tidak dalam status menunggu approval diskon');
    }

    const newStatus = decision === 'APPROVED' ? 'DISCOUNT_APPROVED' : 'DISCOUNT_REJECTED';
    const approvedDiscount = decision === 'APPROVED' ? estimation.requested_discount : null;

    // Update estimation
    const updated = await prisma.estimations.update({
      where: { id: estimationId },
      data: {
        status: newStatus,
        approved_discount: approvedDiscount,
        discount_approved_by_user_id: ceoUserId,
        discount_approved_at: new Date(),
      },
    });

    // TODO: Send notification to Sales (mock for now)
    const salesUser = estimation.users_estimations_requested_by_user_idTousers;
    console.log(
      `[NOTIFICATION] Discount ${decision.toLowerCase()} for estimation ${estimationId} to ${salesUser?.email || 'Sales'}`
    );

    return {
      id: updated.id,
      status: updated.status,
      approved_discount: updated.approved_discount,
      message: `Diskon ${decision === 'APPROVED' ? 'disetujui' : 'ditolak'}`,
    };
  }

  /**
   * Get discount policies for user roles
   */
  async getDiscountPolicies(userRoles: string[]) {
    // Get all discount policies for user's roles
    const policies = await prisma.discount_policies.findMany({
      where: {
        role: {
          in: userRoles,
        },
      },
      orderBy: {
        authority_limit: 'desc',
      },
    });

    if (policies.length === 0) {
      return null;
    }

    // Return the policy with highest authority
    const highestPolicy = policies[0];

    return {
      role: highestPolicy.role,
      authorityLimit: Number(highestPolicy.authority_limit),
      maxDiscountLimit: Number(highestPolicy.max_discount_limit),
      description: highestPolicy.description,
    };
  }

  /**
   * Get discount policy for user (highest authority)
   */
  private async getDiscountPolicyForUser(
    userRoles: string[]
  ): Promise<DiscountPolicy | null> {
    const policies = await prisma.discount_policies.findMany({
      where: {
        role: {
          in: userRoles,
        },
      },
      orderBy: {
        authority_limit: 'desc',
      },
    });

    if (policies.length === 0) {
      return null;
    }

    const highest = policies[0];
    return {
      id: String(highest.id),
      role: highest.role,
      authorityLimit: Number(highest.authority_limit),
      maxDiscountLimit: Number(highest.max_discount_limit),
      description: highest.description || undefined,
    };
  }
}

export default new DiscountApprovalServices();
