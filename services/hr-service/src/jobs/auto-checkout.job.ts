import cron from 'node-cron';
import { getPrisma } from '../utils/prisma';

/**
 * Auto Check-out Job
 * Runs every day at 00:00 (midnight)
 * Automatically checks out employees who forgot to check out
 */
export const startAutoCheckoutJob = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🕛 Running auto check-out job at midnight...');
      
      const prisma = getPrisma();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));
      const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999));

      // Find all attendances from yesterday that don't have check_out_time
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
        console.log('✅ No pending check-outs found.');
        return;
      }

      console.log(`📋 Found ${pendingCheckouts.length} pending check-outs. Processing...`);

      // Auto check-out at 23:59:59 of yesterday
      const autoCheckoutTime = new Date(yesterday.setHours(23, 59, 59, 0));

      const prismaClient = getPrisma();
      
      for (const attendance of pendingCheckouts) {
        const checkInTime = new Date(attendance.check_in_time);
        const workDurationMinutes = Math.floor(
          (autoCheckoutTime.getTime() - checkInTime.getTime()) / 60000
        );

        await prismaClient.hr_attendances.update({
          where: { id: attendance.id },
          data: {
            check_out_time: autoCheckoutTime,
            check_out_location: 'Auto check-out (sistem)',
            work_duration_minutes: workDurationMinutes,
            notes: 'Otomatis check-out oleh sistem pada jam 23:59',
          },
        });

        console.log(
          `✅ Auto check-out: Employee ${attendance.employee_id} - Duration: ${workDurationMinutes} minutes`
        );
      }

      console.log(`🎉 Auto check-out completed for ${pendingCheckouts.length} employees.`);
    } catch (error) {
      console.error('❌ Auto check-out job failed:', error);
    }
  });

  console.log('🚀 Auto check-out job scheduled (runs daily at 00:00)');
};
