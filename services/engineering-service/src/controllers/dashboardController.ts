import { Request, Response } from 'express';
import prisma from '../prisma/client';

// Helper function to parse period
function parsePeriod(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (period) {
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'this_quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      // Default to this month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate };
}

// GET /api/v1/dashboards/engineering
export const getEngineeringDashboard = async (req: Request, res: Response) => {
  try {
    const { period = 'this_quarter', assigneeId } = req.query;

    // Parse period
    const { startDate, endDate } = parsePeriod(period as string);

    // Build filter
    const dateFilter = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    };

    const assigneeFilter = assigneeId
      ? { assigned_to_user_id: assigneeId as string }
      : {};

    // 1. Volume & Kecepatan Kerja
    const requestsIn = await prisma.estimation.count({
      where: {
        ...dateFilter,
        ...assigneeFilter,
      },
    });

    const completedEstimations = await prisma.estimation.count({
      where: {
        status: 'APPROVED',
        updated_at: {
          gte: startDate,
          lte: endDate,
        },
        ...assigneeFilter,
      },
    });

    // Calculate average turnaround time (in days)
    const estimationsWithTime = await prisma.estimation.findMany({
      where: {
        status: 'APPROVED',
        updated_at: {
          gte: startDate,
          lte: endDate,
        },
        ...assigneeFilter,
      },
      select: {
        created_at: true,
        updated_at: true,
      },
    });

    let avgTurnaroundTime = 0;
    if (estimationsWithTime.length > 0) {
      const totalDays = estimationsWithTime.reduce((sum, est) => {
        const diffMs = est.updated_at.getTime() - est.created_at.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);
      avgTurnaroundTime = totalDays / estimationsWithTime.length;
    }

    const volumeMetrics = {
      requestsIn,
      completedEstimations,
      avgTurnaroundTime: Math.round(avgTurnaroundTime * 10) / 10, // Round to 1 decimal
    };

    // 2. Tingkat Akurasi Estimasi
    // Note: Ini membutuhkan data actual_cost di tabel projects
    // Untuk sekarang, kita gunakan mock data atau placeholder
    const accuracyMetrics = {
      avgDeviation: 0, // Placeholder - perlu implementasi dengan actual cost
      topDeviations: [], // Placeholder
    };

    // 3. Beban Kerja Tim
    const workloadData = await prisma.estimation.groupBy({
      by: ['assigned_to_user_id'],
      where: {
        status: 'IN_PROGRESS',
      },
      _count: {
        id: true,
      },
    });

    // Fetch user details for workload
    const workloadWithDetails = await Promise.all(
      workloadData.map(async item => {
        if (!item.assigned_to_user_id) {
          return {
            engineerId: null,
            engineerName: 'Unassigned',
            count: item._count.id,
          };
        }

        const user = await prisma.users.findUnique({
          where: { id: item.assigned_to_user_id },
          include: {
            employee: {
              select: {
                full_name: true,
              },
            },
          },
        });

        return {
          engineerId: item.assigned_to_user_id,
          engineerName: user?.employee?.full_name || user?.email || 'Unknown',
          count: item._count.id,
        };
      })
    );

    const workloadMetrics = {
      details: workloadWithDetails,
      total: workloadData.reduce((sum, item) => sum + item._count.id, 0),
    };

    // 4. Siklus Revisi
    // Note: Ini membutuhkan tabel estimation_logs untuk tracking revisi
    // Untuk sekarang, gunakan status PENDING_INFO sebagai proxy untuk revisi
    // DB enum may be out-of-sync with Prisma schema; compare as text to avoid enum-mismatch errors
    let revisionCount = 0;
    try {
      if (assigneeId) {
        const cnt = (await prisma.$queryRaw`
          SELECT COUNT(*)::int AS count
          FROM "estimations"
          WHERE status::text = ${'PENDING_INFO'}
            AND updated_at >= ${startDate}
            AND updated_at <= ${endDate}
            AND assigned_to_user_id = ${assigneeId}
        `) as Array<{ count: number }>;
        revisionCount = cnt[0]?.count || 0;
      } else {
        const cnt = (await prisma.$queryRaw`
          SELECT COUNT(*)::int AS count
          FROM "estimations"
          WHERE status::text = ${'PENDING_INFO'}
            AND updated_at >= ${startDate}
            AND updated_at <= ${endDate}
        `) as Array<{ count: number }>;
        revisionCount = cnt[0]?.count || 0;
      }
    } catch (e) {
      // If raw count fails, fall back to 0 and log the error
      console.error('Error counting revisions (status PENDING_INFO):', e instanceof Error ? e.message : e);
      revisionCount = 0;
    }

    const revisionRate =
      completedEstimations > 0
        ? Math.round((revisionCount / completedEstimations) * 100 * 10) / 10
        : 0;

    const revisionMetrics = {
      revisionRate,
      revisionCount,
      avgRevisionTime: 0, // Placeholder - perlu tabel logs
    };

    // 5. Status Distribution
    const statusDistribution = await prisma.estimation.groupBy({
      by: ['status'],
      where: {
        ...dateFilter,
        ...assigneeFilter,
      },
      _count: {
        id: true,
      },
    });

    const dashboardData = {
      period: {
        start: startDate,
        end: endDate,
        label: period,
      },
      volumeMetrics,
      accuracyMetrics,
      workloadMetrics,
      revisionMetrics,
      statusDistribution: statusDistribution.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
    };

    res.status(200).json({
      success: true,
      message: 'Engineering dashboard data fetched successfully',
      data: dashboardData,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error fetching engineering dashboard:', msg);
    res.status(500).json({
      success: false,
      error: msg,
    });
  }
};

export default {
  getEngineeringDashboard,
};
