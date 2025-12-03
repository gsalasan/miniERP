import cron from 'node-cron';
import { getPrisma } from '../utils/prisma';

/**
 * Process auto checkout for pending attendances
 */
async function processAutoCheckout() {
  try {
    console.log('🕛 Running auto check-out job at:', new Date().toISOString());
    
    const prisma = getPrisma();

    // Get current time
    const now = new Date();
    
    // Get today's date range (start at 00:00, end at 23:59:59)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    console.log('Date range:', { todayStart, todayEnd });

    // Find all attendances from today that don't have check_out_time
    const pendingCheckouts = await prisma.hr_attendances.findMany({
      where: {
        check_in_time: {
          gte: todayStart,
          lte: todayEnd,
        },
        check_out_time: null,
      },
    });

    if (pendingCheckouts.length === 0) {
      console.log('✅ No pending check-outs found for today.');
      return;
    }

    console.log(`📋 Found ${pendingCheckouts.length} pending check-outs. Processing auto checkout...`);

    // Auto check-out at 23:59:00 of today
    const autoCheckoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0);

    for (const attendance of pendingCheckouts) {
      const checkInTime = new Date(attendance.check_in_time);
      const workDurationMinutes = Math.floor(
        (autoCheckoutTime.getTime() - checkInTime.getTime()) / 60000
      );

      // Log sebelum update
      console.log('[AUTO-CHECKOUT][BEFORE]', {
        id: attendance.id,
        employee_id: attendance.employee_id,
        date: attendance.date,
        check_in_time: attendance.check_in_time,
        check_out_time: attendance.check_out_time
      });

      await prisma.hr_attendances.update({
        where: { id: attendance.id },
        data: {
          check_out_time: autoCheckoutTime,
          check_out_location: 'Auto check-out (sistem)',
          work_duration_minutes: workDurationMinutes,
          notes: 'Otomatis check-out oleh sistem pada jam 23:59',
        },
      });

      // Fetch after update
      const after = await prisma.hr_attendances.findUnique({ where: { id: attendance.id } });
      console.log('[AUTO-CHECKOUT][AFTER]', {
        id: after?.id,
        employee_id: after?.employee_id,
        date: after?.date,
        check_in_time: after?.check_in_time,
        check_out_time: after?.check_out_time,
        work_duration_minutes: after?.work_duration_minutes
      });

      console.log(
        `✅ Auto check-out: Employee ${attendance.employee_id} - Duration: ${workDurationMinutes} minutes`
      );
    }

    console.log(`🎉 Auto check-out completed for ${pendingCheckouts.length} employees.`);
  } catch (error) {
    console.error('❌ Auto check-out job failed:', error);
  }
}

/**
 * Auto Check-out Job
 * Runs every day at 23:59 (11:59 PM)
 * Automatically checks out employees who forgot to check out
 */
export const startAutoCheckoutJob = () => {
  // JANGAN run on startup - biarkan user checkout manual dulu
  // Hanya run sesuai schedule di 23:59
  
  // Run every day at 23:59 (11:59 PM)
  cron.schedule('59 23 * * *', async () => {
    console.log('⏰ Scheduled auto check-out triggered at 23:59');
    await processAutoCheckout();
  });

  console.log('✅ Auto check-out job scheduled (runs daily at 23:59)');
  console.log('⚠️  Auto checkout will NOT run on startup - only at 23:59 daily');
};
