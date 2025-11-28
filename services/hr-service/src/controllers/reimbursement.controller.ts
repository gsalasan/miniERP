import { Request, Response } from 'express';
import { ReimbursementService } from '../services/reimbursement.service';
import { resolveHrEmployee } from '../utils/hrEmployeeResolver';

const reimbursementService = new ReimbursementService();

export class ReimbursementController {
  /**
   * Create a new reimbursement request
   * POST /api/v1/reimbursements
   */
  async createReimbursement(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { getPrisma } = await import('../utils/prisma');
      const prisma = getPrisma();
      const hrEmployee = await resolveHrEmployee(prisma, {
        userId,
        email: req.user?.email,
      });

      const reimbursement = await reimbursementService.createReimbursementRequest(
        hrEmployee.id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Reimbursement request created successfully',
        data: reimbursement,
      });
    } catch (error: any) {
      console.error('Error creating reimbursement request:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create reimbursement request',
      });
    }
  }

  /**
   * Get my reimbursement requests
   * GET /api/v1/reimbursements/my
   */
  async getMyReimbursements(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { getPrisma } = await import('../utils/prisma');
      const prisma = getPrisma();
      const hrEmployee = await resolveHrEmployee(prisma, {
        userId,
        email: req.user?.email,
      });

      const { status } = req.query;
      const reimbursements = await reimbursementService.getEmployeeReimbursements(
        hrEmployee.id,
        status as string
      );

      res.json({
        success: true,
        data: reimbursements,
      });
    } catch (error: any) {
      console.error('Error getting reimbursements:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get reimbursements',
      });
    }
  }

  /**
   * Get all reimbursement requests (HR/Manager)
   * GET /api/v1/reimbursements
   */
  async getAllReimbursements(req: Request, res: Response): Promise<void> {
    try {
      const { status, page, limit } = req.query;

      const result = await reimbursementService.getAllReimbursements({
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('Error getting all reimbursements:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get reimbursements',
      });
    }
  }

  /**
   * Get reimbursement request by ID
   * GET /api/v1/reimbursements/:id
   */
  async getReimbursementById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const reimbursement = await reimbursementService.getReimbursementById(id);

      if (!reimbursement) {
        res.status(404).json({
          success: false,
          error: 'Reimbursement request not found',
        });
        return;
      }

      res.json({
        success: true,
        data: reimbursement,
      });
    } catch (error: any) {
      console.error('Error getting reimbursement:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get reimbursement',
      });
    }
  }

  /**
   * Approve/Reject reimbursement request
   * PUT /api/v1/reimbursements/:id/status
   */
  async updateReimbursementStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { status, rejection_reason } = req.body;

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be APPROVED or REJECTED',
        });
        return;
      }

      const reimbursement = await reimbursementService.updateReimbursementStatus(id, {
        status,
        approved_by: userId,
        rejection_reason,
      });

      res.json({
        success: true,
        message: `Reimbursement request ${status.toLowerCase()} successfully`,
        data: reimbursement,
      });
    } catch (error: any) {
      console.error('Error updating reimbursement status:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update reimbursement status',
      });
    }
  }

  /**
   * Mark reimbursement as paid
   * POST /api/v1/reimbursements/:id/paid
   */
  async markReimbursementPaid(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const reimbursement = await reimbursementService.markReimbursementPaid(id);

      res.json({
        success: true,
        message: 'Reimbursement marked as paid successfully',
        data: reimbursement,
      });
    } catch (error: any) {
      console.error('Error marking reimbursement as paid:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to mark reimbursement as paid',
      });
    }
  }

  /**
   * Cancel reimbursement request
   * POST /api/v1/reimbursements/:id/cancel
   */
  async cancelReimbursement(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { getPrisma } = await import('../utils/prisma');
      const prisma = getPrisma();
      const hrEmployee = await resolveHrEmployee(prisma, {
        userId,
        email: req.user?.email,
      });

      const { id } = req.params;
      const reimbursement = await reimbursementService.cancelReimbursement(id, hrEmployee.id);

      res.json({
        success: true,
        message: 'Reimbursement request cancelled successfully',
        data: reimbursement,
      });
    } catch (error: any) {
      console.error('Error cancelling reimbursement:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to cancel reimbursement',
      });
    }
  }

  /**
   * Get reimbursement summary for finance
   * GET /api/v1/reimbursements/summary?month=2024-11&employeeId=xxx
   */
  async getReimbursementSummary(req: Request, res: Response): Promise<void> {
    try {
      const { month, employeeId } = req.query;

      const summary = await reimbursementService.getReimbursementSummary({
        month: month as string,
        employeeId: employeeId as string,
      });

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Error getting reimbursement summary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get reimbursement summary',
      });
    }
  }
}
