import { Router } from 'express';
import { OvertimeController } from '../controllers/overtime.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const overtimeController = new OvertimeController();

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/v1/overtimes
 * @desc    Create a new overtime request
 * @access  Private (Employee)
 * @body    { overtime_code: 'L1'|'L2'|'L3'|'L4', overtime_date, start_time, end_time, duration_hours, description }
 * @note    L1: Lembur Weekday 8 jam, L2: Lembur Weekday 4 jam, L3: Lembur Weekend 8 jam, L4: Lembur Weekend 4 jam
 */
router.post('/', (req, res) => overtimeController.createOvertime(req, res));

/**
 * @route   GET /api/v1/overtimes/my
 * @desc    Get my overtime requests
 * @access  Private (Employee)
 */
router.get('/my', (req, res) => overtimeController.getMyOvertimes(req, res));

/**
 * @route   GET /api/v1/overtimes/summary
 * @desc    Get overtime summary for payroll
 * @access  Private (HR/Payroll)
 * @query   month (format: YYYY-MM), employeeId
 */
router.get('/summary', (req, res) => overtimeController.getOvertimeSummary(req, res));

/**
 * @route   GET /api/v1/overtimes
 * @desc    Get all overtime requests (HR/Manager)
 * @access  Private (HR/Manager)
 */
router.get('/', (req, res) => overtimeController.getAllOvertimes(req, res));

/**
 * @route   GET /api/v1/overtimes/:id
 * @desc    Get overtime request by ID
 * @access  Private
 */
router.get('/:id', (req, res) => overtimeController.getOvertimeById(req, res));

/**
 * @route   PUT /api/v1/overtimes/:id/status
 * @desc    Approve/Reject overtime request
 * @access  Private (HR/Manager)
 */
router.put('/:id/status', (req, res) => overtimeController.updateOvertimeStatus(req, res));

/**
 * @route   POST /api/v1/overtimes/:id/cancel
 * @desc    Cancel overtime request
 * @access  Private (Employee - own request only)
 */
router.post('/:id/cancel', (req, res) => overtimeController.cancelOvertime(req, res));

export default router;
