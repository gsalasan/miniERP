import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const leaveController = new LeaveController();

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/v1/leaves
 * @desc    Create a new leave request
 * @access  Private (Employee)
 */
router.post('/', (req, res) => leaveController.createLeave(req, res));

/**
 * @route   GET /api/v1/leaves/my
 * @desc    Get my leave requests
 * @access  Private (Employee)
 */
router.get('/my', (req, res) => leaveController.getMyLeaves(req, res));

/**
 * @route   GET /api/v1/leaves
 * @desc    Get all leave requests (HR/Manager)
 * @access  Private (HR/Manager)
 */
router.get('/', (req, res) => leaveController.getAllLeaves(req, res));

/**
 * @route   GET /api/v1/leaves/:id
 * @desc    Get leave request by ID
 * @access  Private
 */
router.get('/:id', (req, res) => leaveController.getLeaveById(req, res));

/**
 * @route   PUT /api/v1/leaves/:id/status
 * @desc    Approve/Reject leave request
 * @access  Private (HR/Manager)
 */
router.put('/:id/status', (req, res) => leaveController.updateLeaveStatus(req, res));

/**
 * @route   POST /api/v1/leaves/:id/cancel
 * @desc    Cancel leave request
 * @access  Private (Employee - own request only)
 */
router.post('/:id/cancel', (req, res) => leaveController.cancelLeave(req, res));

export default router;
