import express from 'express';
import * as approvalController from '../controllers/approval.controller';

const router = express.Router();

// Get requests for manager (team approvals)
router.get('/team/:managerId', approvalController.getTeamRequests);

// Get all requests (HR admin approvals)
router.get('/all', approvalController.getAllRequests);

// Check if employee has subordinates
router.get('/check-subordinates/:employeeId', approvalController.checkSubordinates);

// Leave request approvals
router.put('/leave/approve/:requestId', approvalController.approveLeaveRequest);
router.put('/leave/reject/:requestId', approvalController.rejectLeaveRequest);

// Permission request approvals
router.put('/permission/approve/:requestId', approvalController.approvePermissionRequest);
router.put('/permission/reject/:requestId', approvalController.rejectPermissionRequest);

// Overtime request approvals
router.put('/overtime/approve/:requestId', approvalController.approveOvertimeRequest);
router.put('/overtime/reject/:requestId', approvalController.rejectOvertimeRequest);

// Reimbursement request approvals
router.put('/reimbursement/approve/:requestId', approvalController.approveReimbursementRequest);
router.put('/reimbursement/reject/:requestId', approvalController.rejectReimbursementRequest);

export default router;
