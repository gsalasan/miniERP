import { Request, Response } from 'express';
import { LeaveService } from '../services/leave.service';
import { resolveHrEmployee } from '../utils/hrEmployeeResolver';

const leaveService = new LeaveService();

export class LeaveController {
  /**
   * Create a new leave request
   * POST /api/v1/leaves
   */
  async createLeave(req: Request, res: Response): Promise<void> {
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

      const leave = await leaveService.createLeaveRequest(hrEmployee.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Leave request created successfully',
        data: leave,
      });
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create leave request',
      });
    }
  }

  /**
   * Get my leave requests
   * GET /api/v1/leaves/my
   */
  async getMyLeaves(req: Request, res: Response): Promise<void> {
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
      const leaves = await leaveService.getEmployeeLeaves(hrEmployee.id, status as string);

      res.json({
        success: true,
        data: leaves,
      });
    } catch (error: any) {
      console.error('Error getting leaves:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get leaves',
      });
    }
  }

  /**
   * Get all leave requests (HR/Manager)
   * GET /api/v1/leaves
   */
  async getAllLeaves(req: Request, res: Response): Promise<void> {
    try {
      const { status, page, limit } = req.query;

      const result = await leaveService.getAllLeaves({
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
      console.error('Error getting all leaves:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get leaves',
      });
    }
  }

  /**
   * Get leave request by ID
   * GET /api/v1/leaves/:id
   */
  async getLeaveById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const leave = await leaveService.getLeaveById(id);

      if (!leave) {
        res.status(404).json({
          success: false,
          error: 'Leave request not found',
        });
        return;
      }

      res.json({
        success: true,
        data: leave,
      });
    } catch (error: any) {
      console.error('Error getting leave:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get leave',
      });
    }
  }

  /**
   * Approve/Reject leave request
   * PUT /api/v1/leaves/:id/status
   */
  async updateLeaveStatus(req: Request, res: Response): Promise<void> {
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
      const { status, rejection_reason } = req.body;

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be APPROVED or REJECTED',
        });
        return;
      }

      const leave = await leaveService.updateLeaveStatus(id, {
        status,
        approved_by: hrEmployee.id,
        rejection_reason,
      });

      res.json({
        success: true,
        message: `Leave request ${status.toLowerCase()} successfully`,
        data: leave,
      });
    } catch (error: any) {
      console.error('Error updating leave status:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update leave status',
      });
    }
  }

  /**
   * Cancel leave request
   * POST /api/v1/leaves/:id/cancel
   */
  async cancelLeave(req: Request, res: Response): Promise<void> {
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
      const leave = await leaveService.cancelLeave(id, hrEmployee.id);

      res.json({
        success: true,
        message: 'Leave request cancelled successfully',
        data: leave,
      });
    } catch (error: any) {
      console.error('Error cancelling leave:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to cancel leave',
      });
    }
  }
}
