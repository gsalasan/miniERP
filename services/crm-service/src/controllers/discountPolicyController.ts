import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

class DiscountPolicyController {
  /**
   * GET /api/v1/discount-policies/:role
   * Get discount policy by role
   */
  async getDiscountPolicyByRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role } = req.params;

      console.log('[getDiscountPolicyByRole] Request for role:', role);

      // Get discount policy
      const policy = await prisma.discount_policies.findUnique({
        where: { role: role },
      });

      if (!policy) {
        console.log('[getDiscountPolicyByRole] Policy not found for role:', role);
        res.status(404).json({
          success: false,
          message: `Discount policy not found for role: ${role}`,
        });
        return;
      }

      console.log('[getDiscountPolicyByRole] Policy found:', policy);

      res.status(200).json({
        success: true,
        data: {
          id: policy.id,
          role: policy.role,
          authority_limit: Number(policy.authority_limit),
          max_discount_limit: Number(policy.max_discount_limit),
          description: policy.description,
        },
      });
    } catch (error) {
      const err = error as Error;
      console.error('[getDiscountPolicyByRole] Error:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to get discount policy',
        error: err.message,
      });
    }
  }
}

export default new DiscountPolicyController();
