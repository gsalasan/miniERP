import { PrismaClient } from '@prisma/client';

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
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find user to get employee_id
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { employee_id: true }
    });

    if (!user || !user.employee_id) {
      return null;
    }

    const attendance = await prisma.hr_attendances.findFirst({
      where: {
        employee_id: user.employee_id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
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

    // TODO: Add geofence validation for office workers
    // For now, we accept all locations

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

    return {
      data,
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
   * TODO: Make office location and radius configurable
   */
  private async validateGeofence(
    latitude: number,
    longitude: number,
    employeeId: string
  ): Promise<boolean> {
    // TODO: Get office location from employee's work location settings
    // For now, we'll skip geofence validation
    // Example implementation:
    // const officeLatitude = -6.200000;
    // const officeLongitude = 106.816666;
    // const allowedRadiusMeters = 100;
    // const distance = this.calculateDistance(latitude, longitude, officeLatitude, officeLongitude);
    // return distance <= allowedRadiusMeters;
    
    return true; // Accept all locations for now
  }
}
