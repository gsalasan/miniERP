import { Request, Response } from 'express';
import { getPrisma } from '../utils/prisma';

export async function getHRStats(req: Request, res: Response) {
  try {
    const prisma = getPrisma();

    const totalEmployees = await prisma.hr_employees.count();

    const activeEmployees = await prisma.hr_employees.count({
      where: { status: 'ACTIVE' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const presentToday = await prisma.hr_attendances.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
        check_in: {
          not: null,
        },
      },
    });

    const leaveRequests = await prisma.hr_leave_requests.count({
      where: { status: 'PENDING' },
    });

    let overtimeRequests = 0;
    try {
      overtimeRequests = await prisma.hr_overtime_requests.count({
        where: { status: 'PENDING' },
      });
    } catch (error) {
      console.log('Overtime table not found');
    }

    let pendingPayroll = 0;
    try {
      pendingPayroll = await prisma.hr_payrolls.count({
        where: { status: 'PENDING' },
      });
    } catch (error) {
      console.log('Payroll table not found');
    }

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        presentToday,
        leaveRequests,
        overtimeRequests,
        pendingPayroll,
      },
    });
  } catch (error) {
    console.error('Error fetching HR stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch HR statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Return attendance count for the last 7 days (including today)
// getAttendanceTrend7Days removed (UI-only request)
