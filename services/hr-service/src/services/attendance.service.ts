import { Prisma, hr_attendances } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getPrisma } from '../utils/prisma';
import { resolveHrEmployee } from '../utils/hrEmployeeResolver';

dayjs.extend(utc);
dayjs.extend(timezone);

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

interface AttendanceUserContext {
  id: string;
  email?: string;
  employeeId?: string;
}

interface AttendanceSubjectFilter {
  user?: AttendanceUserContext;
  employeeId?: string;
}

type AttendanceWithEmployee = hr_attendances & {
  employee?: {
    id: string;
    full_name: string | null;
    position: string | null;
    department?: string | null;
  } | null;
};

export class AttendanceService {
  private prisma = getPrisma();
  private readonly tz = 'Asia/Jakarta';

  /**
   * Get today's attendance for a user
   */
  async getTodayAttendance(user: AttendanceUserContext) {
    const employee = await this.resolveEmployee(user);
    // Get current Jakarta time and format as YYYY-MM-DD string
    const todayJakartaStr = dayjs().tz(this.tz).format('YYYY-MM-DD');
    // Parse it back to create a Date at midnight Jakarta time without timezone conversion
    const todayJakartaDate = new Date(todayJakartaStr + 'T00:00:00.000+07:00');

    const attendance = await this.prisma.hr_attendances.findFirst({
      where: {
        employee_id: employee.id,
        date: todayJakartaDate,
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
          },
        },
      },
    });

    return attendance ? this.normalizeAttendance(attendance) : null;
  }

  /**
   * Check-in
   */
  async checkIn(user: AttendanceUserContext, geoLocation: GeoLocation) {
    const employee = await this.resolveEmployee(user);
    const existingAttendance = await this.getTodayAttendance(user);
    if (existingAttendance) {
      throw new Error('Already checked in today');
    }

    this.validateCoordinates(geoLocation);

    const geofenceOk = await this.validateGeofence(
      geoLocation.latitude,
      geoLocation.longitude,
      employee.id
    );
    if (!geofenceOk) {
      throw new Error('Location is outside the allowed area');
    }

    // Set timezone to Jakarta for this session
    await this.prisma.$executeRaw`SET TIME ZONE 'Asia/Jakarta'`;
    
    const nowJakarta = dayjs().tz(this.tz);
    // Store date as YYYY-MM-DD at midnight Jakarta time WITHOUT timezone conversion
    const jakartaDateStr = nowJakarta.format('YYYY-MM-DD');
    const jakartaMidnight = new Date(jakartaDateStr + 'T00:00:00.000+07:00');
    // Store check-in time as is in Jakarta timezone
    const checkInTime = new Date(nowJakarta.format('YYYY-MM-DDTHH:mm:ss.SSS') + '+07:00');
    
    const attendance = await this.prisma.hr_attendances.create({
      data: {
        employee_id: employee.id,
        date: jakartaMidnight,
        check_in_time: checkInTime,
        check_in_latitude: geoLocation.latitude,
        check_in_longitude: geoLocation.longitude,
        check_in_location:
          geoLocation.location || `${geoLocation.latitude}, ${geoLocation.longitude}`,
        status: 'PRESENT',
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
          },
        },
      },
    });

    return this.normalizeAttendance(attendance);
  }

  /**
   * Check-out
   */
  async checkOut(user: AttendanceUserContext, geoLocation: GeoLocation) {
    const attendance = await this.getTodayAttendance(user);
    if (!attendance) {
      throw new Error('No check-in record found for today');
    }

    if (attendance.check_out_time) {
      throw new Error('Already checked out today');
    }

    this.validateCoordinates(geoLocation);

    const geofenceOk = await this.validateGeofence(
      geoLocation.latitude,
      geoLocation.longitude,
      attendance.employee_id
    );
    if (!geofenceOk) {
      throw new Error('Location is outside the allowed area');
    }

    const nowJakarta = dayjs().tz(this.tz);
    const checkInTime = attendance.check_in_time
      ? dayjs(attendance.check_in_time)
      : nowJakarta;
    const durationMinutes = Math.max(0, nowJakarta.diff(checkInTime, 'minute'));
    // Store check-out time in Jakarta timezone
    const checkOutTime = new Date(nowJakarta.format('YYYY-MM-DDTHH:mm:ss.SSS') + '+07:00');

    const updatedAttendance = await this.prisma.hr_attendances.update({
      where: { id: attendance.id },
      data: {
        check_out_time: checkOutTime,
        check_out_latitude: geoLocation.latitude,
        check_out_longitude: geoLocation.longitude,
        check_out_location:
          geoLocation.location || `${geoLocation.latitude}, ${geoLocation.longitude}`,
        work_duration_minutes: durationMinutes,
      },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
          },
        },
      },
    });

    return this.normalizeAttendance(updatedAttendance);
  }

  /**
   * Get attendances with filters and pagination
   */
  async getAttendances(
    subject?: AttendanceSubjectFilter,
    filters?: AttendanceFilters
  ) {
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.hr_attendancesWhereInput = {};
    const targetEmployeeId = await this.resolveSubjectToEmployeeId(subject);
    if (subject && !targetEmployeeId) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
    if (targetEmployeeId) {
      where.employee_id = targetEmployeeId;
    }

    if (filters?.month) {
      const { startDate, endDate } = this.getMonthRange(filters.month);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const total = await this.prisma.hr_attendances.count({ where });
    const rows = await this.prisma.hr_attendances.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
            department: true,
          },
        },
      },
    });

    const data = (rows as AttendanceWithEmployee[]).map((row) => {
      const normalized = this.normalizeAttendance(row);
      return {
        ...normalized,
        jam:
          normalized.check_in_time || normalized.check_out_time
            ? `${this.formatJakartaTime(normalized.check_in_time)} - ${this.formatJakartaTime(
                normalized.check_out_time
              )}`
            : '',
      };
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
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get attendance statistics for a month
   */
  async getAttendanceStats(month: string, subject?: AttendanceSubjectFilter) {
    const { startDate, endDate } = this.getMonthRange(month);
    const where: Prisma.hr_attendancesWhereInput = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    const targetEmployeeId = await this.resolveSubjectToEmployeeId(subject);
    if (subject && !targetEmployeeId) {
      return this.emptyStats(month);
    }
    if (targetEmployeeId) {
      where.employee_id = targetEmployeeId;
    }

    const attendances = (await this.prisma.hr_attendances.findMany({ where })) as hr_attendances[];
    if (!attendances.length) {
      return this.emptyStats(month);
    }

    const totalDays = attendances.length;
    const presentDays = attendances.filter((attendance) => attendance.status === 'PRESENT').length;
    const lateDays = attendances.filter((attendance) => attendance.status === 'LATE').length;
    const absentDays = attendances.filter((attendance) => attendance.status === 'ABSENT').length;
    const totalWorkMinutes = attendances.reduce<number>(
      (sum, item) => sum + (item.work_duration_minutes || 0),
      0
    );
    const averageWorkMinutes = Math.floor(totalWorkMinutes / totalDays);

    return {
      month,
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      totalWorkMinutes,
      averageWorkMinutes,
      averageWorkHours: (averageWorkMinutes / 60 || 0).toFixed(2),
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
  private async resolveEmployee(user: AttendanceUserContext) {
    console.log('[AttendanceService] Resolving employee for user:', {
      userId: user.id,
      email: user.email,
      employeeId: user.employeeId
    });
    const employee = await resolveHrEmployee(this.prisma, {
      userId: user.id,
      email: user.email,
      employeeId: user.employeeId,
    });
    console.log('[AttendanceService] Resolved employee:', employee.id);
    return employee;
  }

  private getTodayBounds() {
    const nowJakarta = dayjs().tz(this.tz);
    return {
      nowJakarta,
      startUtc: nowJakarta.startOf('day').utc().toDate(),
      endUtc: nowJakarta.endOf('day').utc().toDate(),
    };
  }

  private normalizeAttendance(attendance: any) {
    const toNumber = (value: any) =>
      value === null || value === undefined ? null : Number(value);
    
    // Convert all timestamps to Jakarta timezone ISO strings
    const toJakartaISO = (date: any) => {
      if (!date) return null;
      return dayjs(date).tz(this.tz).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    };

    return {
      ...attendance,
      // Convert date field to Jakarta date string (YYYY-MM-DD)
      date: attendance.date ? dayjs(attendance.date).tz(this.tz).format('YYYY-MM-DD') : null,
      check_in_time: toJakartaISO(attendance.check_in_time),
      check_out_time: toJakartaISO(attendance.check_out_time),
      check_in_latitude: toNumber(attendance.check_in_latitude),
      check_in_longitude: toNumber(attendance.check_in_longitude),
      check_out_latitude: toNumber(attendance.check_out_latitude),
      check_out_longitude: toNumber(attendance.check_out_longitude),
    };
  }

  private validateCoordinates({ latitude, longitude }: GeoLocation) {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude');
    }
  }

  private formatJakartaTime(date?: Date | string | null) {
    if (!date) return '';
    const d = dayjs(date).tz(this.tz);
    return d.isValid() ? d.format('HH:mm') : '';
  }

  private getMonthRange(month: string) {
    const [year, monthNum] = month.split('-').map(Number);
    if (!year || !monthNum) {
      throw new Error('Invalid month format. Use YYYY-MM');
    }

    const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));
    return { startDate, endDate };
  }

  private async resolveSubjectToEmployeeId(subject?: AttendanceSubjectFilter) {
    if (!subject) {
      return undefined;
    }

    if (subject.user) {
      const employee = await this.resolveEmployee(subject.user);
      return employee.id;
    }

    if (subject.employeeId) {
      const employee = await this.prisma.employees.findUnique({
        where: { id: subject.employeeId },
        select: { id: true },
      });
      if (employee) {
        return employee.id;
      }

      const user = await this.prisma.users.findUnique({
        where: { id: subject.employeeId },
        select: { employee_id: true },
      });

      return user?.employee_id || undefined;
    }

    return undefined;
  }

  private emptyStats(month: string) {
    return {
      month,
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      totalWorkMinutes: 0,
      averageWorkMinutes: 0,
      averageWorkHours: '0.00',
    };
  }

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
