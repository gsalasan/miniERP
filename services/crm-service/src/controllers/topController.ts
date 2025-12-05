import { Request, Response } from 'express';
import {
  changeTOPService,
  approveTOPChangeService,
  getTOPHistoryService,
  applyScheduledTOPChangesService,
  ChangeTOPRequest,
  ApproveTOPRequest,
} from '../services/topServices';

/**
 * POST /api/v1/customers/:id/top
 * Change customer TOP (Terms of Payment)
 */
export const changeTOP = async (req: Request, res: Response) => {
  try {
    const { id: customerId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not authenticated',
      });
    }

    const data: ChangeTOPRequest = req.body;

    // Validate input
    if (typeof data.new_top_days !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'new_top_days is required and must be a number',
      });
    }

    if (!data.reason || data.reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'reason is required and must be at least 5 characters',
      });
    }

    const result = await changeTOPService(customerId, userId, data);

    // Return 202 for pending/scheduled, 200 for immediate
    const statusCode = result.status === 'APPROVED' ? 200 : 202;

    return res.status(statusCode).json(result);
  } catch (error) {
    console.error('Error in changeTOP:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to change TOP',
    });
  }
};

/**
 * GET /api/v1/customers/:id/top-history
 * Get TOP change history for a customer
 */
export const getTOPHistory = async (req: Request, res: Response) => {
  try {
    const { id: customerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getTOPHistoryService(customerId, page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in getTOPHistory:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get TOP history',
    });
  }
};

/**
 * POST /api/v1/top-changes/:historyId/approve
 * Approve or reject a pending TOP change request
 */
export const approveTOPChange = async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params;
    const userId = (req as any).user?.id;
    const userRoles = (req as any).user?.roles || [];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not authenticated',
      });
    }

    // Check if user has permission to approve (Sales Manager or CEO)
    const canApprove = userRoles.some((role: string) =>
      ['SALES_MANAGER', 'CEO'].includes(role)
    );

    if (!canApprove) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden - Only Sales Manager or CEO can approve TOP changes',
      });
    }

    const data: ApproveTOPRequest = req.body;

    if (typeof data.approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'approved field is required and must be a boolean',
      });
    }

    const result = await approveTOPChangeService(historyId, userId, data);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in approveTOPChange:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to approve TOP change',
    });
  }
};

/**
 * POST /api/v1/top-changes/apply-scheduled (internal/cron only)
 * Apply scheduled TOP changes
 */
export const applyScheduledChanges = async (req: Request, res: Response) => {
  try {
    // This endpoint should only be called by system/cron
    // In production, add IP whitelist or internal API key check

    const result = await applyScheduledTOPChangesService();

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in applyScheduledChanges:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to apply scheduled changes',
    });
  }
};
