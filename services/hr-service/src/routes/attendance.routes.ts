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

/**
 * @route   POST /api/v1/attendances/trigger-auto-checkout
 * @desc    Manually trigger auto checkout (for testing)
 * @access  Private (HR Admin)
 */
router.post('/trigger-auto-checkout', async (req, res) => {
  try {
    const prisma = (await import('../utils/prisma')).getPrisma();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
    const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));

    const pendingCheckouts = await prisma.hr_attendances.findMany({
      where: {
        check_in_time: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
        check_out_time: null,
      },
    });

    if (pendingCheckouts.length === 0) {
      return res.json({
        success: true,
        message: 'No pending check-outs found',
        data: { processed: 0 },
      });
    }

    const autoCheckoutTime = new Date(yesterday.setHours(23, 59, 59, 0));
    const results = [];

    for (const attendance of pendingCheckouts) {
      const checkInTime = new Date(attendance.check_in_time);
      const workDurationMinutes = Math.floor(
        (autoCheckoutTime.getTime() - checkInTime.getTime()) / 60000
      );

      await prisma.hr_attendances.update({
        where: { id: attendance.id },
        data: {
          check_out_time: autoCheckoutTime,
          check_out_location: 'Auto check-out (sistem)',
          work_duration_minutes: workDurationMinutes,
          notes: 'Otomatis check-out oleh sistem pada jam 23:59 (manual trigger)',
        },
      });

      results.push({
        employee_id: attendance.employee_id,
        check_in: attendance.check_in_time,
        check_out: autoCheckoutTime,
        duration_minutes: workDurationMinutes,
      });
    }

    res.json({
      success: true,
      message: `Auto check-out completed for ${results.length} employees`,
      data: { processed: results.length, results },
    });
  } catch (error) {
    console.error('Manual auto checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger auto checkout',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
