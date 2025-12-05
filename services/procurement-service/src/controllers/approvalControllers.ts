import { Request, Response } from 'express';
import {
  submitPOForApproval,
  approvePO,
  rejectPO,
  getPendingApprovalsForUser,
  getApprovalThresholds,
} from '../services/approvalServices';

/**
 * Submit PO for approval
 * POST /api/procurement/po/:id/submit-for-approval
 */
export async function submitForApproval(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const submittedBy = req.body.submitted_by || req.body.user_id;

    if (!submittedBy) {
      return res.status(400).json({
        success: false,
        message: 'submitted_by or user_id is required',
      });
    }

    const result = await submitPOForApproval(id, submittedBy);

    res.json({
      success: true,
      message: 'PO submitted for approval successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error submitting PO for approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit PO for approval',
      error: error.message,
    });
  }
}

/**
 * Approve PO
 * POST /api/procurement/po/:id/approve
 */
export async function approvePurchaseOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { approver_id, comments } = req.body;

    if (!approver_id) {
      return res.status(400).json({
        success: false,
        message: 'approver_id is required',
      });
    }

    const result = await approvePO(id, approver_id, comments);

    res.json({
      success: true,
      message: 'PO approved successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error approving PO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve PO',
      error: error.message,
    });
  }
}

/**
 * Reject PO
 * POST /api/procurement/po/:id/reject
 */
export async function rejectPurchaseOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { rejecter_id, comments } = req.body;

    if (!rejecter_id) {
      return res.status(400).json({
        success: false,
        message: 'rejecter_id is required',
      });
    }

    if (!comments) {
      return res.status(400).json({
        success: false,
        message: 'comments is required for rejection',
      });
    }

    const result = await rejectPO(id, rejecter_id, comments);

    res.json({
      success: true,
      message: 'PO rejected successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error rejecting PO:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject PO',
      error: error.message,
    });
  }
}

// Removed sendToVendor function - PO is sent manually by procurement team
// PDF generation is now handled in pdfControllers.ts

/**
 * Get pending approvals for logged-in user
 * GET /api/procurement/po/pending-approvals
 */
export async function getPendingApprovals(req: Request, res: Response) {
  try {
    const userId = req.query.user_id as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'user_id query parameter is required',
      });
    }

    const pos = await getPendingApprovalsForUser(userId);

    res.json({
      success: true,
      message: 'Pending approvals retrieved successfully',
      data: pos,
      count: pos.length,
    });
  } catch (error: any) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending approvals',
      error: error.message,
    });
  }
}

/**
 * Get approval thresholds configuration
 * GET /api/procurement/approval-thresholds
 */
export async function getThresholds(req: Request, res: Response) {
  try {
    const thresholds = await getApprovalThresholds();

    res.json({
      success: true,
      message: 'Approval thresholds retrieved successfully',
      data: thresholds,
    });
  } catch (error: any) {
    console.error('Error getting approval thresholds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get approval thresholds',
      error: error.message,
    });
  }
}
