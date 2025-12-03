import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.service';
import { resolveHrEmployee } from '../utils/hrEmployeeResolver';

const permissionService = new PermissionService();

export class PermissionController {
  /**
   * Create a new permission request
   * POST /api/v1/permissions
   */
  async createPermission(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get employee_id from user
      const { getPrisma } = await import('../utils/prisma');
      const prisma = getPrisma();
      const hrEmployee = await resolveHrEmployee(prisma, {
        userId,
        email: req.user?.email,
      });

      const permission = await permissionService.createPermissionRequest(hrEmployee.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Permission request created successfully',
        data: permission,
      });
    } catch (error: any) {
      console.error('Error creating permission request:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create permission request',
      });
    }
  }

  /**
   * Get my permission requests
   * GET /api/v1/permissions/my
   */
  async getMyPermissions(req: Request, res: Response): Promise<void> {
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
      const permissions = await permissionService.getEmployeePermissions(
        hrEmployee.id,
        status as string
      );

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error: any) {
      console.error('Error getting permissions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get permissions',
      });
    }
  }

  /**
   * Get all permission requests (HR/Manager)
   * GET /api/v1/permissions
   */
  async getAllPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { status, page, limit } = req.query;

      const result = await permissionService.getAllPermissions({
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
      console.error('Error getting all permissions:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get permissions',
      });
    }
  }

  /**
   * Get permission request by ID
   * GET /api/v1/permissions/:id
   */
  async getPermissionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const permission = await permissionService.getPermissionById(id);

      if (!permission) {
        res.status(404).json({
          success: false,
          error: 'Permission request not found',
        });
        return;
      }

      res.json({
        success: true,
        data: permission,
      });
    } catch (error: any) {
      console.error('Error getting permission:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get permission',
      });
    }
  }

  /**
   * Approve/Reject permission request
   * PUT /api/v1/permissions/:id/status
   */
  async updatePermissionStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get employee_id from user
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

      const permission = await permissionService.updatePermissionStatus(id, {
        status,
        approved_by: hrEmployee.id,
        rejection_reason,
      });

      res.json({
        success: true,
        message: `Permission request ${status.toLowerCase()} successfully`,
        data: permission,
      });
    } catch (error: any) {
      console.error('Error updating permission status:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update permission status',
      });
    }
  }

  /**
   * Cancel permission request
   * POST /api/v1/permissions/:id/cancel
   */
  async cancelPermission(req: Request, res: Response): Promise<void> {
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
      const permission = await permissionService.cancelPermission(id, hrEmployee.id);

      res.json({
        success: true,
        message: 'Permission request cancelled successfully',
        data: permission,
      });
    } catch (error: any) {
      console.error('Error cancelling permission:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to cancel permission',
      });
    }
  }
}
