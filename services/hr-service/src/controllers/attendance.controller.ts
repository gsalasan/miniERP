import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import axios from 'axios';

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
   * Reverse geocoding - convert lat/lng to address
   * GET /api/v1/attendances/reverse-geocode?lat=xxx&lng=xxx
   */
  async reverseGeocode(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
        return;
      }

      console.log(`[ReverseGeocode] Request for lat=${lat}, lng=${lng}`);

      // Call Nominatim API from backend (bypass CORS)
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`;
      console.log('[ReverseGeocode] Calling:', nominatimUrl);

      const response = await axios.get(nominatimUrl, {
        headers: {
          'User-Agent': 'miniERP-attendance-system/1.0'
        },
        timeout: 5000
      });

      const data = response.data;
      console.log('[ReverseGeocode] Response:', JSON.stringify(data).substring(0, 200));
      
      if (data && data.address) {
        const addr = data.address;
        const parts: string[] = [];
        
        // Format alamat yang lebih readable
        if (addr.road) parts.push(addr.road);
        else if (addr.neighbourhood) parts.push(addr.neighbourhood);
        
        if (addr.suburb || addr.village) parts.push(addr.suburb || addr.village);
        if (addr.city_district) parts.push(addr.city_district);
        else if (addr.city) parts.push(addr.city);
        
        const shortAddress = parts.slice(0, 3).join(', ') || data.display_name.split(',').slice(0, 3).join(',');
        
        console.log('[ReverseGeocode] Success:', shortAddress);
        res.json({
          success: true,
          data: {
            address: shortAddress,
            fullAddress: data.display_name
          }
        });
      } else {
        console.log('[ReverseGeocode] No address data, returning coordinates');
        res.json({
          success: true,
          data: {
            address: `${lat}, ${lng}`,
            fullAddress: `${lat}, ${lng}`
          }
        });
      }
    } catch (error: any) {
      console.error('[ReverseGeocode] Error:', error.message);
      // Return coordinates as fallback instead of error
      const { lat, lng } = req.query;
      res.json({
        success: true,
        data: {
          address: `${lat}, ${lng}`,
          fullAddress: `${lat}, ${lng}`
        }
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
