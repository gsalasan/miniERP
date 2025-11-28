import { Request, Response } from 'express';
import * as approvalService from '../services/approval.service';

/**
 * GET /api/approvals/team/:managerId
 * Get pending requests dari anak buah (team members)
 */
export const getTeamRequests = async (req: Request, res: Response) => {
  try {
    const { managerId } = req.params;

    if (!managerId) {
      return res.status(400).json({ error: 'Manager ID is required' });
    }

    const requests = await approvalService.getTeamRequests(managerId);
    res.json(requests);
  } catch (error) {
    console.error('Error in getTeamRequests controller:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team requests',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /api/approvals/all
 * Get ALL pending requests (untuk HR Admin)
 */
export const getAllRequests = async (req: Request, res: Response) => {
  try {
    const requests = await approvalService.getAllRequests();
    res.json(requests);
  } catch (error) {
    console.error('Error in getAllRequests controller:', error);
    res.status(500).json({ 
      error: 'Failed to fetch all requests',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * PUT /api/approvals/leave/approve/:requestId
 * Approve leave request
 */
export const approveLeaveRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { approved_by } = req.body;

    if (!approved_by) {
      return res.status(400).json({ error: 'approved_by is required' });
    }

    const updated = await approvalService.approveLeaveRequest(requestId, approved_by);
    res.json({ 
      message: 'Leave request approved successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error approving leave request:', error);
    res.status(500).json({ 
      error: 'Failed to approve leave request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * PUT /api/approvals/leave/reject/:requestId
 * Reject leave request
 */
export const rejectLeaveRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    if (!rejected_by || !rejection_reason) {
      return res.status(400).json({ error: 'rejected_by and rejection_reason are required' });
    }

    const updated = await approvalService.rejectLeaveRequest(requestId, rejected_by, rejection_reason);
    res.json({ 
      message: 'Leave request rejected',
      data: updated
    });
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    res.status(500).json({ 
      error: 'Failed to reject leave request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * PUT /api/approvals/permission/approve/:requestId
 * Approve permission request
 */
export const approvePermissionRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { approved_by } = req.body;

    if (!approved_by) {
      return res.status(400).json({ error: 'approved_by is required' });
    }

    const updated = await approvalService.approvePermissionRequest(requestId, approved_by);
    res.json({ 
      message: 'Permission request approved successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error approving permission request:', error);
    res.status(500).json({ 
      error: 'Failed to approve permission request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * PUT /api/approvals/permission/reject/:requestId
 * Reject permission request
 */
export const rejectPermissionRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    if (!rejected_by || !rejection_reason) {
      return res.status(400).json({ error: 'rejected_by and rejection_reason are required' });
    }

    const updated = await approvalService.rejectPermissionRequest(requestId, rejected_by, rejection_reason);
    res.json({ 
      message: 'Permission request rejected',
      data: updated
    });
  } catch (error) {
    console.error('Error rejecting permission request:', error);
    res.status(500).json({ 
      error: 'Failed to reject permission request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * PUT /api/approvals/overtime/approve/:requestId
 * Approve overtime request
 */
export const approveOvertimeRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { approved_by } = req.body;

    if (!approved_by) {
      return res.status(400).json({ error: 'approved_by is required' });
    }

    const updated = await approvalService.approveOvertimeRequest(requestId, approved_by);
    res.json({ 
      message: 'Overtime request approved successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error approving overtime request:', error);
    res.status(500).json({ 
      error: 'Failed to approve overtime request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * PUT /api/approvals/overtime/reject/:requestId
 * Reject overtime request
 */
export const rejectOvertimeRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    if (!rejected_by || !rejection_reason) {
      return res.status(400).json({ error: 'rejected_by and rejection_reason are required' });
    }

    const updated = await approvalService.rejectOvertimeRequest(requestId, rejected_by, rejection_reason);
    res.json({ 
      message: 'Overtime request rejected',
      data: updated
    });
  } catch (error) {
    console.error('Error rejecting overtime request:', error);
    res.status(500).json({ 
      error: 'Failed to reject overtime request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * PUT /api/approvals/reimbursement/approve/:requestId
 * Approve reimbursement request
 */
export const approveReimbursementRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { approved_by } = req.body;

    if (!approved_by) {
      return res.status(400).json({ error: 'approved_by is required' });
    }

    const updated = await approvalService.approveReimbursementRequest(requestId, approved_by);
    res.json({ 
      message: 'Reimbursement request approved successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error approving reimbursement request:', error);
    res.status(500).json({ 
      error: 'Failed to approve reimbursement request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * PUT /api/approvals/reimbursement/reject/:requestId
 * Reject reimbursement request
 */
export const rejectReimbursementRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    if (!rejected_by || !rejection_reason) {
      return res.status(400).json({ error: 'rejected_by and rejection_reason are required' });
    }

    const updated = await approvalService.rejectReimbursementRequest(requestId, rejected_by, rejection_reason);
    res.json({ 
      message: 'Reimbursement request rejected',
      data: updated
    });
  } catch (error) {
    console.error('Error rejecting reimbursement request:', error);
    res.status(500).json({ 
      error: 'Failed to reject reimbursement request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET /api/approvals/check-subordinates/:employeeId
 * Check if employee has subordinates (is a manager)
 */
export const checkSubordinates = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const result = await approvalService.checkHasSubordinates(employeeId);
    res.json(result);
  } catch (error) {
    console.error('Error checking subordinates:', error);
    res.status(500).json({ 
      error: 'Failed to check subordinates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
