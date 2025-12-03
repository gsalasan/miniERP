import { Request, Response } from 'express';
import { OvertimeService } from '../services/overtime.service';
import { resolveHrEmployee } from '../utils/hrEmployeeResolver';

const overtimeService = new OvertimeService();

export class OvertimeController {
  /**
   * Create a new overtime request
   * POST /api/v1/overtimes
   */
  async createOvertime(req: Request, res: Response): Promise<void> {
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

      const overtime = await overtimeService.createOvertimeRequest(hrEmployee.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Overtime request created successfully',
        data: overtime,
      });
    } catch (error: any) {
      console.error('Error creating overtime request:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create overtime request',
      });
    }
  }

  /**
   * Get my overtime requests
   * GET /api/v1/overtimes/my
   */
  async getMyOvertimes(req: Request, res: Response): Promise<void> {
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
      const overtimes = await overtimeService.getEmployeeOvertimes(
        hrEmployee.id,
        status as string
      );

      res.json({
        success: true,
        data: overtimes,
      });
    } catch (error: any) {
      console.error('Error getting overtimes:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get overtimes',
      });
    }
  }

  /**
   * Get all overtime requests (HR/Manager)
   * GET /api/v1/overtimes
   */
  async getAllOvertimes(req: Request, res: Response): Promise<void> {
    try {
      const { status, page, limit } = req.query;

      const result = await overtimeService.getAllOvertimes({
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
      console.error('Error getting all overtimes:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get overtimes',
      });
    }
  }

  /**
   * Get overtime request by ID
   * GET /api/v1/overtimes/:id
   */
  async getOvertimeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const overtime = await overtimeService.getOvertimeById(id);

      if (!overtime) {
        res.status(404).json({
          success: false,
          error: 'Overtime request not found',
        });
        return;
      }

      res.json({
        success: true,
        data: overtime,
      });
    } catch (error: any) {
      console.error('Error getting overtime:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get overtime',
      });
    }
  }

  /**
   * Approve/Reject overtime request
   * PUT /api/v1/overtimes/:id/status
   */
  async updateOvertimeStatus(req: Request, res: Response): Promise<void> {
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

      const overtime = await overtimeService.updateOvertimeStatus(id, {
        status,
        approved_by: userId,
        rejection_reason,
      });

      res.json({
        success: true,
        message: `Overtime request ${status.toLowerCase()} successfully`,
        data: overtime,
      });
    } catch (error: any) {
      console.error('Error updating overtime status:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update overtime status',
      });
    }
  }

  /**
   * Cancel overtime request
   * POST /api/v1/overtimes/:id/cancel
   */
  async cancelOvertime(req: Request, res: Response): Promise<void> {
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
      const overtime = await overtimeService.cancelOvertime(id, hrEmployee.id);

      res.json({
        success: true,
        message: 'Overtime request cancelled successfully',
        data: overtime,
      });
    } catch (error: any) {
      console.error('Error cancelling overtime:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to cancel overtime',
      });
    }
  }

  /**
   * Get overtime summary for payroll
   * GET /api/v1/overtimes/summary?month=2024-11&employeeId=xxx
   */
  async getOvertimeSummary(req: Request, res: Response): Promise<void> {
    try {
      const { month, employeeId } = req.query;

      if (!month || !employeeId) {
        res.status(400).json({
          success: false,
          error: 'month and employeeId are required',
        });
        return;
      }

      const summary = await overtimeService.getOvertimeSummary(
        employeeId as string,
        month as string
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Error getting overtime summary:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get overtime summary',
      });
    }
  }
}
