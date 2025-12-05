import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();

interface GeoLocation {
  latitude: number;
  longitude: number;
  location?: string;
}

interface AttendanceFilters {
  month?: string;
  page?: number;
  limit?: number;
}

export class AttendanceService {
  /**
   * Get today's attendance for a user
   */
  async getTodayAttendance(userId: string) {


  // Gunakan Asia/Jakarta untuk filter tanggal check_in_time
  const tz = 'Asia/Jakarta';
  const nowJakarta = dayjs().tz(tz);
  // Ambil rentang waktu hari ini di Asia/Jakarta, lalu konversi ke UTC agar query DB benar
  const todayStartJakarta = nowJakarta.startOf('day');
  const todayEndJakarta = nowJakarta.endOf('day');
  const todayStartUTC = todayStartJakarta.utc().toDate();
  const todayEndUTC = todayEndJakarta.utc().toDate();

    // Find user to get employee_id
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { employee_id: true }
    });

    if (!user || !user.employee_id) {
      return null;
    }

    // Cari attendance dengan check_in_time hari ini (Asia/Jakarta, di-query pakai UTC)
    const attendance = await prisma.hr_attendances.findFirst({
      where: {
        employee_id: user.employee_id,
        check_in_time: {
          gte: todayStartUTC,
          lte: todayEndUTC,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true
          }
        }
      }
    });

    // Convert Decimal to number for JSON serialization
    if (attendance) {
      return {
        ...attendance,
        check_in_latitude: attendance.check_in_latitude ? Number(attendance.check_in_latitude) : null,
        check_in_longitude: attendance.check_in_longitude ? Number(attendance.check_in_longitude) : null,
        check_out_latitude: attendance.check_out_latitude ? Number(attendance.check_out_latitude) : null,
        check_out_longitude: attendance.check_out_longitude ? Number(attendance.check_out_longitude) : null,
      };
    }

    return attendance;
  }

  /**
   * Check-in
   */
  async checkIn(userId: string, geoLocation: GeoLocation) {
    // Find user to get employee_id
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { employee_id: true, email: true }
    });

    console.log('User from token:', { userId, user });

    if (!user || !user.employee_id) {
      throw new Error(`Employee not found for user ${user?.email || userId}. Please link this user to an employee first.`);
    }

    // Check if already checked in today
    const existingAttendance = await this.getTodayAttendance(userId);
    if (existingAttendance) {
      throw new Error('Already checked in today');
    }

    // Validate geo-location (basic validation)
    if (geoLocation.latitude < -90 || geoLocation.latitude > 90) {
      throw new Error('Invalid latitude');
    }
    if (geoLocation.longitude < -180 || geoLocation.longitude > 180) {
      throw new Error('Invalid longitude');
    }

    // Geofence validation: ensure location is within allowed radius
    const geofenceOk = await this.validateGeofence(geoLocation.latitude, geoLocation.longitude, user.employee_id);
    if (!geofenceOk) {
      throw new Error('Location is outside the allowed area');
    }

    // Create attendance record
    const attendance = await prisma.hr_attendances.create({
      data: {
        employee_id: user.employee_id,
        date: new Date(),
        check_in_time: new Date(),
        check_in_latitude: geoLocation.latitude,
        check_in_longitude: geoLocation.longitude,
        check_in_location: geoLocation.location || `${geoLocation.latitude}, ${geoLocation.longitude}`,
        status: 'PRESENT'
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true
          }
        }
      }
    });

    // Convert Decimal to number for JSON serialization
    return {
      ...attendance,
      check_in_latitude: Number(attendance.check_in_latitude),
      check_in_longitude: Number(attendance.check_in_longitude),
      check_out_latitude: attendance.check_out_latitude ? Number(attendance.check_out_latitude) : null,
      check_out_longitude: attendance.check_out_longitude ? Number(attendance.check_out_longitude) : null,
    };
  }
  /**
   * Check-out
   */
  async checkOut(userId: string, geoLocation: GeoLocation) {
    // Find user to get employee_id
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { employee_id: true }
    });

    if (!user || !user.employee_id) {
      throw new Error('Employee not found');
    }

    // Find today's attendance
    const attendance = await this.getTodayAttendance(userId);
    if (!attendance) {
      throw new Error('No check-in record found for today');
    }

    if (attendance.check_out_time) {
      throw new Error('Already checked out today');
    }

    // Validate geo-location
    if (geoLocation.latitude < -90 || geoLocation.latitude > 90) {
      throw new Error('Invalid latitude');
    }
    if (geoLocation.longitude < -180 || geoLocation.longitude > 180) {
      throw new Error('Invalid longitude');
    }

    // Geofence validation for check-out as well
    const geofenceOk = await this.validateGeofence(geoLocation.latitude, geoLocation.longitude, user.employee_id);
    if (!geofenceOk) {
      throw new Error('Location is outside the allowed area');
    }

    // Calculate work duration in minutes
    const checkInTime = attendance.check_in_time ? new Date(attendance.check_in_time) : new Date();
    const checkOutTime = new Date();
    const durationMs = checkOutTime.getTime() - checkInTime.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);

    // Update attendance record
    const updatedAttendance = await prisma.hr_attendances.update({
      where: { id: attendance.id },
      data: {
        check_out_time: checkOutTime,
        check_out_latitude: geoLocation.latitude,
        check_out_longitude: geoLocation.longitude,
        check_out_location: geoLocation.location || `${geoLocation.latitude}, ${geoLocation.longitude}`,
        work_duration_minutes: durationMinutes
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true
          }
        }
      }
    });

    return updatedAttendance;
  }

  /**
   * Get attendances with filters and pagination
   */
  async getAttendances(employeeUserId?: string, filters?: AttendanceFilters) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // If employeeUserId provided, filter by that employee
    if (employeeUserId) {
      const user = await prisma.users.findUnique({
        where: { id: employeeUserId },
        select: { employee_id: true }
      });
      
      if (user && user.employee_id) {
        where.employee_id = user.employee_id;
      } else {
        // No employee found, return empty
        return {
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        };
      }
    }

    // Filter by month if provided (format: YYYY-MM)
    if (filters?.month) {
      const [year, month] = filters.month.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    // Get total count
    const total = await prisma.hr_attendances.count({ where });

    // Get data
    const data = await prisma.hr_attendances.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        date: 'desc'
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true
          }
        }
      }
    });

    // Helper to format Date to HH:mm (24h) in Asia/Jakarta
    function formatTimeJakarta(date?: Date | string | null): string {
      if (!date) return '';
      const d = dayjs(date).tz('Asia/Jakarta');
      if (!d.isValid()) return '';
      return d.format('HH:mm');
    }

    // Add 'jam' field to each record
    const dataWithJam = data.map((item) => ({
      ...item,
      jam: item.check_in_time || item.check_out_time
        ? `${formatTimeJakarta(item.check_in_time)} - ${formatTimeJakarta(item.check_out_time)}`
        : '',
    }));

    return {
      data: dataWithJam,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get attendance statistics for a month
   */
  async getAttendanceStats(month: string, employeeUserId?: string) {
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Build where clause
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };

    // Filter by employee if provided
    if (employeeUserId) {
      const user = await prisma.users.findUnique({
        where: { id: employeeUserId },
        select: { employee_id: true }
      });
      
      if (user && user.employee_id) {
        where.employee_id = user.employee_id;
      }
    }

    // Get all attendances for the month
    const attendances = await prisma.hr_attendances.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            full_name: true
          }
        }
      }
    });

    // Calculate statistics
    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.status === 'PRESENT').length;
    const lateDays = attendances.filter(a => a.status === 'LATE').length;
    const absentDays = attendances.filter(a => a.status === 'ABSENT').length;
    
    // Calculate total work duration
    const totalWorkMinutes = attendances.reduce((sum, a) => {
      return sum + (a.work_duration_minutes || 0);
    }, 0);

    const averageWorkMinutes = totalDays > 0 ? Math.floor(totalWorkMinutes / totalDays) : 0;

    return {
      month,
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      totalWorkMinutes,
      averageWorkMinutes,
      averageWorkHours: (averageWorkMinutes / 60).toFixed(2)
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Validate geofence (check if location is within allowed radius)
   * By default, geofence is DISABLED so employees can check-in from anywhere.
   * To enable geofence, set HR_GEOFENCE_ENABLED=true in environment.
   */
  private async validateGeofence(
    latitude: number,
    longitude: number,
    employeeId: string
  ): Promise<boolean> {
    // Default: DISABLED — allow attendance from anywhere
    // Only enforce geofence if explicitly enabled via environment variable
    const enabled = process.env.HR_GEOFENCE_ENABLED === 'true';
    if (!enabled) {
      return true; // Allow all locations by default
    }

    const officeLat = parseFloat(process.env.HR_OFFICE_LAT || '-6.200000');
    const officeLng = parseFloat(process.env.HR_OFFICE_LNG || '106.816666');
    const allowedRadiusMeters = parseFloat(process.env.HR_OFFICE_RADIUS_METERS || '1000');

    if (isNaN(officeLat) || isNaN(officeLng) || isNaN(allowedRadiusMeters)) {
      // Misconfiguration: allow by default but log warning
      console.warn('[Geofence] Invalid environment geofence configuration, allowing location by default');
      return true;
    }

    const distance = this.calculateDistance(latitude, longitude, officeLat, officeLng);
    console.log('[Geofence] Distance (m):', distance, 'Allowed (m):', allowedRadiusMeters);
    return distance <= allowedRadiusMeters;
  }
}
