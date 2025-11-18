import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';

const attendanceService = new AttendanceService();

export class AttendanceController {
  /**
   * Get today's attendance for current user
   * GET /api/v1/attendances/today
   */
  async getTodayAttendance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const attendance = await attendanceService.getTodayAttendance(userId);
      res.json({
        success: true,
        data: attendance
      });
    } catch (error: any) {
      console.error('Error getting today attendance:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to get today attendance' 
      });
    }
  }

  /**
   * Check-in with geo-location
   * POST /api/v1/attendances/checkin
   * Body: { latitude: number, longitude: number, location?: string }
   */
  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { latitude, longitude, location } = req.body;

      if (!latitude || !longitude) {
        res.status(400).json({ 
          success: false,
          error: 'Latitude and longitude are required' 
        });
        return;
      }

      const attendance = await attendanceService.checkIn(userId, {
        latitude,
        longitude,
        location
      });

      res.status(201).json({
        success: true,
        message: 'Successfully checked in',
        data: attendance
      });
    } catch (error: any) {
      console.error('Error checking in:', error);
      res.status(400).json({ 
        success: false,
        error: error.message || 'Failed to check in' 
      });
    }
  }

  /**
   * Check-out with geo-location
   * POST /api/v1/attendances/checkout
   * Body: { latitude: number, longitude: number, location?: string }
   */
  async checkOut(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { latitude, longitude, location } = req.body;

      if (!latitude || !longitude) {
        res.status(400).json({ 
          success: false,
          error: 'Latitude and longitude are required' 
        });
        return;
      }

      const attendance = await attendanceService.checkOut(userId, {
        latitude,
        longitude,
        location
      });

      res.json({
        success: true,
        message: 'Successfully checked out',
        data: attendance
      });
    } catch (error: any) {
      console.error('Error checking out:', error);
      res.status(400).json({ 
        success: false,
        error: error.message || 'Failed to check out' 
      });
    }
  }

  /**
   * Get my attendance history
   * GET /api/v1/attendances/my?month=2024-01&page=1&limit=20
   */
  async getMyAttendances(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { month, page = '1', limit = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const result = await attendanceService.getAttendances(userId, {
        month: month as string,
        page: pageNum,
        limit: limitNum
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error getting my attendances:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to get attendances' 
      });
    }
  }

  /**
   * Get all employees' attendances (HR admin only)
   * GET /api/v1/attendances?month=2024-01&employeeId=xxx&page=1&limit=20
   */
  async getAllAttendances(req: Request, res: Response): Promise<void> {
    try {
      const { month, employeeId, page = '1', limit = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const result = await attendanceService.getAttendances(
        employeeId as string | undefined,
        {
          month: month as string,
          page: pageNum,
          limit: limitNum
        }
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error getting all attendances:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to get attendances' 
      });
    }
  }

  /**
   * Get attendance statistics for a month (HR admin)
   * GET /api/v1/attendances/stats?month=2024-01&employeeId=xxx
   */
  async getAttendanceStats(req: Request, res: Response): Promise<void> {
    try {
      const { month, employeeId } = req.query;

      if (!month) {
        res.status(400).json({ 
          success: false,
          error: 'Month parameter is required (format: YYYY-MM)' 
        });
        return;
      }

      const stats = await attendanceService.getAttendanceStats(
        month as string,
        employeeId as string | undefined
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Error getting attendance stats:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to get attendance statistics' 
      });
    }
  }
}
