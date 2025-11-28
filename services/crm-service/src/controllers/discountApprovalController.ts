import { Request, Response } from 'express';
import discountApprovalServices from '../services/discountApprovalServices';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

class DiscountApprovalController {
  async requestDiscountApproval(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { requested_discount } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!requested_discount || requested_discount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Requested discount must be greater than 0',
        });
        return;
      }

      const result = await discountApprovalServices.requestDiscountApproval(
        id,
        userId,
        Number(requested_discount)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      
      // Business rule errors (422)
      if (
        err.message.includes('tidak perlu approval') ||
        err.message.includes('melebihi batas maksimal') ||
        err.message.includes('tidak ditemukan')
      ) {
        res.status(422).json({
          success: false,
          message: err.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to request discount approval',
        error: err.message,
      });
    }
  }

  /**
   * PUT /api/v1/estimations/:id/decide-discount
   * CEO approve or reject discount request
   */
  async decideDiscount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { decision } = req.body;
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Check if user is CEO
      if (!userRoles.includes('CEO')) {
        res.status(403).json({
          success: false,
          message: 'Only CEO can approve/reject discount requests',
        });
        return;
      }

      if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
        res.status(400).json({
          success: false,
          message: 'Decision must be either APPROVED or REJECTED',
        });
        return;
      }

      const result = await discountApprovalServices.decideDiscount(
        id,
        userId,
        decision as 'APPROVED' | 'REJECTED'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;

      if (err.message.includes('tidak ditemukan') || err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: err.message,
        });
        return;
      }

      if (err.message.includes('tidak dalam status')) {
        res.status(422).json({
          success: false,
          message: err.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to decide discount',
        error: err.message,
      });
    }
  }

  /**
   * GET /api/v1/discount-policies
   * Get discount policies for current user
   */
  async getDiscountPolicies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRoles = req.user?.roles || [];

      const policies = await discountApprovalServices.getDiscountPolicies(userRoles);

      res.status(200).json({
        success: true,
        data: policies,
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: 'Failed to get discount policies',
        error: err.message,
      });
    }
  }
}

export default new DiscountApprovalController();
