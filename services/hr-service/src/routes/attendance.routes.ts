import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
const attendanceController = new AttendanceController();

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * @route   GET /api/v1/attendances/today
 * @desc    Get today's attendance for current user
 * @access  Private (Employee)
 */
router.get('/today', (req, res) => attendanceController.getTodayAttendance(req, res));

/**
 * @route   POST /api/v1/attendances/checkin
 * @desc    Check-in with geo-location
 * @access  Private (Employee)
 * @body    { latitude: number, longitude: number, location?: string }
 */
router.post('/checkin', (req, res) => attendanceController.checkIn(req, res));

/**
 * @route   POST /api/v1/attendances/checkout
 * @desc    Check-out with geo-location
 * @access  Private (Employee)
 * @body    { latitude: number, longitude: number, location?: string }
 */
router.post('/checkout', (req, res) => attendanceController.checkOut(req, res));

/**
 * @route   GET /api/v1/attendances/my
 * @desc    Get my attendance history
 * @access  Private (Employee)
 * @query   month (optional, format: YYYY-MM), page, limit
 */
router.get('/my', (req, res) => attendanceController.getMyAttendances(req, res));

/**
 * @route   GET /api/v1/attendances
 * @desc    Get all employees' attendances (HR admin)
 * @access  Private (HR Admin)
 * @query   month (optional, format: YYYY-MM), employeeId (optional), page, limit
 */
router.get('/', (req, res) => attendanceController.getAllAttendances(req, res));

/**
 * @route   GET /api/v1/attendances/stats
 * @desc    Get attendance statistics for a month
 * @access  Private (HR Admin)
 * @query   month (required, format: YYYY-MM), employeeId (optional)
 */
router.get('/stats', (req, res) => attendanceController.getAttendanceStats(req, res));

export default router;
