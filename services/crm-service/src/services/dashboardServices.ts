import prisma from '../utils/prisma';

export interface SalesDashboardQuery {
  sales_user_id?: string;
  period?: string; // e.g. this_month, this_quarter, this_year, custom
  from?: string; // optional ISO date for custom ranges
  to?: string;
}

function parsePeriodToRange(period?: string, from?: string, to?: string) {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  try {
    if (period === 'this_month' || !period) {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'this_quarter') {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
    } else if (period === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (period === 'custom' && from && to) {
      start = new Date(from);
      end = new Date(to);
      end.setHours(23, 59, 59, 999);
    } else {
      // fallback to month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
  } catch (e) {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { start, end };
}

export async function getSalesDashboard(user: any, query: SalesDashboardQuery = {}) {
  // RBAC check: allow SALES, SALES_LEADER, SALES_MANAGER, CEO, MANAGER
  const roles: string[] = (user?.roles as string[]) || (user?.role ? [user.role] : []);
  const allowed = ['SALES', 'SALES_LEADER', 'SALES_MANAGER', 'CEO', 'MANAGER'];
  const hasRole = roles.some((r) => allowed.includes(r));
  if (!hasRole) throw new Error('Insufficient permissions');

  const filterSalesUserId = query.sales_user_id;
  // If the caller is a plain SALES user, restrict to their own data
  if (roles.includes('SALES') && !roles.includes('SALES_MANAGER') && !roles.includes('CEO')) {
    // override any provided filter
    query.sales_user_id = user?.id;
  }

  const salesUserFilter = query.sales_user_id ? { project: { sales_user_id: query.sales_user_id } } : {};

  // Funnel stages we care about
  const stages = ['PROSPECT', 'MEETING_SCHEDULED', 'PRE_SALES', 'PROPOSAL_DELIVERED', 'WON', 'LOST'];

  // Parse period into concrete range
  const { start: periodStart, end: periodEnd } = parsePeriodToRange(query.period, query.from, query.to);

  // Get counts and total values per stage from projects
  // For funnel counts we consider projects in the selected statuses and created within the period
  const projects = await prisma.project.findMany({
    where: {
      ...(query.sales_user_id ? { sales_user_id: query.sales_user_id } : {}),
      status: { in: stages },
      created_at: { gte: periodStart, lte: periodEnd },
    },
    select: { id: true, status: true, estimated_value: true, contract_value: true },
  });

  const funnel = stages.map((s) => {
    const items = projects.filter((p) => p.status === s);
    const totalValue = items.reduce((sum, p) => sum + Number(p.contract_value || p.estimated_value || 0), 0);
    return { status: s, count: items.length, total_value: totalValue };
  });

  // Actual revenue: sum of sales_orders.total_value, optionally filtered by project.sales_user_id
  // Actual revenue: sum of sales_orders.total_value for orders within the period (signed_date)
  const actualAgg = await prisma.sales_orders.aggregate({
    _sum: { total_value: true },
    where: {
      ...(query.sales_user_id ? { project: { sales_user_id: query.sales_user_id } } : {}),
      signed_date: { gte: periodStart, lte: periodEnd },
    },
  });
  const actualRevenue = Number(actualAgg._sum.total_value || 0);

  // Targets: hybrid logic
  // - If a project is already WON, prefer the finalized `contract_value` (actual contract signed)
  // - Otherwise prefer `estimated_value` (pipeline estimate) and fall back to `contract_value` if estimate missing
  const targetRevenue: number | null = projects.reduce((sum, p) => {
    const used = p.status === 'WON'
      ? Number(p.contract_value ?? 0)
      : Number(p.estimated_value ?? p.contract_value ?? 0);
    return sum + used;
  }, 0) || null;

  // Activities: count recent activities grouped by type (limit last 1000 rows for performance)
  // Activities within the period
  const activitiesRows = await prisma.projectActivity.findMany({
    where: {
      ...(query.sales_user_id ? { project: { sales_user_id: query.sales_user_id } } : {}),
      performed_at: { gte: periodStart, lte: periodEnd },
    },
    select: { activity_type: true, metadata: true },
    take: 2000,
  });
  const activities: Record<string, number> = {};
  activitiesRows.forEach((r) => { activities[r.activity_type] = (activities[r.activity_type] || 0) + 1; });

  // Sales itinerary-style counts: planned vs completed
  // We don't have a dedicated sales_itineraries table in schema; try to infer from ProjectActivity metadata
  const plannedCount = await prisma.projectActivity.count({
    where: {
      ...(query.sales_user_id ? { project: { sales_user_id: query.sales_user_id } } : {}),
      performed_at: { gte: periodStart, lte: periodEnd },
    },
  });
  // Completed: look for activity_type that indicates completion or metadata.status == 'COMPLETED'
  const completedCount = await prisma.projectActivity.count({
    where: {
      ...(query.sales_user_id ? { project: { sales_user_id: query.sales_user_id } } : {}),
      performed_at: { gte: periodStart, lte: periodEnd },
      OR: [
        { activity_type: 'MEETING' },
        { activity_type: 'CALL' },
        { activity_type: 'EMAIL' },
        { activity_type: 'PROPOSAL_SENT' },
      ],
    } as any,
  });

  // Summary counts
  const customersWhere = query.sales_user_id ? { sales_pic: query.sales_user_id } : {};
  const totalCustomers = await prisma.customers.count({ where: customersWhere });

  const salesOrdersWhere = query.sales_user_id ? { project: { sales_user_id: query.sales_user_id } } : {};
  // Try to read count from legacy table `sales_prders` if it exists (some deployments use different table names),
  // otherwise fallback to the canonical `sales_orders` Prisma model.
  let totalSalesOrders = 0;
  try {
    // Parameterize values to avoid SQL injection
    const salesUserClause = query.sales_user_id ? 'AND project ->> ' || "'sales_user_id'" : '';
    // Use a conservative raw query: count rows where signed_date within period and optional sales_user_id via join to projects
    if (query.sales_user_id) {
      const res: any = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS cnt
        FROM sales_orders s
        JOIN projects p ON p.id = s.project_id
        WHERE p.sales_user_id = ${query.sales_user_id}
          AND s.signed_date >= ${periodStart}
          AND s.signed_date <= ${periodEnd}`;
      totalSalesOrders = Number(res?.[0]?.cnt || 0);
    } else {
      const res: any = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS cnt
        FROM sales_orders s
        WHERE s.signed_date >= ${periodStart}
          AND s.signed_date <= ${periodEnd}`;
      totalSalesOrders = Number(res?.[0]?.cnt || 0);
    }
  } catch (e) {
    // If the legacy table doesn't exist or query fails, fallback to Prisma model `sales_orders`
    try {
      totalSalesOrders = await prisma.sales_orders.count({ where: salesOrdersWhere });
    } catch (er) {
      // final fallback to zero
      totalSalesOrders = 0;
    }
  }

  const contactsWhere = query.sales_user_id
    ? { customers: { sales_pic: query.sales_user_id } }
    : {};
  const totalContacts = await prisma.customer_contacts.count({ where: contactsWhere });

  // Active / inactive / retention
  const activeCustomers = await prisma.customers.count({ where: { ...(customersWhere as any), status: 'ACTIVE' } });
  const inactiveCustomers = totalCustomers - activeCustomers;
  const inactiveRate = totalCustomers > 0 ? Number(((inactiveCustomers / totalCustomers) * 100).toFixed(2)) : null;
  const customerRetention = totalCustomers > 0 ? Number(((activeCustomers / totalCustomers) * 100).toFixed(2)) : null;

  // Recent activities (detailed list)
  // Recent activities (detailed list) within the period
  const recentActivities = await prisma.projectActivity.findMany({
    where: {
      ...(query.sales_user_id ? { project: { sales_user_id: query.sales_user_id } } : {}),
      performed_at: { gte: periodStart, lte: periodEnd },
    },
    orderBy: { performed_at: 'desc' },
    take: 10,
    include: {
      project: { select: { id: true, project_name: true } },
    },
  });

  // Win rate
  // Count won/lost within the period (use actual_close_date where available)
  const won = await prisma.project.count({
    where: {
      ...(query.sales_user_id ? { sales_user_id: query.sales_user_id } : {}),
      status: 'WON',
      actual_close_date: { gte: periodStart, lte: periodEnd },
    },
  });
  const lost = await prisma.project.count({
    where: {
      ...(query.sales_user_id ? { sales_user_id: query.sales_user_id } : {}),
      status: 'LOST',
      updated_at: { gte: periodStart, lte: periodEnd },
    },
  });
  const winRate = (won + lost) > 0 ? (won / (won + lost)) * 100 : null;

  return {
    target_vs_actual: {
      target: targetRevenue,
      actual: actualRevenue,
      percent: targetRevenue && targetRevenue > 0 ? Math.round((actualRevenue / targetRevenue) * 100) : 0,
    },
    funnel,
    activities,
    sales_activity: {
      planned: plannedCount,
      completed: completedCount,
      completion_rate: plannedCount > 0 ? Number(((completedCount / plannedCount) * 100).toFixed(2)) : null,
      details: activities,
    },
    win_rate: {
      won,
      lost,
      rate: winRate === null ? null : Number(winRate.toFixed(2)),
    },
    summary: {
      total_customers: totalCustomers,
      total_sales_orders: totalSalesOrders,
      total_contacts: totalContacts,
      active_customers: activeCustomers,
      inactive_customers: inactiveCustomers,
      inactive_rate: inactiveRate,
      customer_retention: customerRetention,
    },
    recent_activities: recentActivities,
    // Incentive simulation: if the logged-in user is SALES, provide a simple simulation (2% of WON sales in period)
    incentive_simulation: (roles.includes('SALES') && !roles.includes('SALES_MANAGER') && !roles.includes('CEO'))
      ? {
        plan: 'DEFAULT_2_PERCENT',
        description: '2% of total WON contract value in period (simple simulation)',
        estimated: Number((actualRevenue * 0.02).toFixed(0)),
        currency: 'IDR',
      }
      : null,
    // Channel / product analysis for managerial roles
    channel_analysis: (roles.includes('SALES_MANAGER') || roles.includes('CEO')) ? await (async () => {
      const rows = await prisma.project.groupBy({
        by: ['customer_id'],
        where: {
          ...(query.sales_user_id ? { sales_user_id: query.sales_user_id } : {}),
          created_at: { gte: periodStart, lte: periodEnd },
        },
        _sum: { contract_value: true },
      });
      // Map customer_id to channel by lookup
      const customerIds = rows.map(r => r.customer_id);
      const customers = await prisma.customers.findMany({ where: { id: { in: customerIds } }, select: { id: true, channel: true } });
      const channelMap: Record<string, string> = {};
      customers.forEach(c => { channelMap[c.id] = c.channel; });
      const byChannel: Record<string, number> = {};
      rows.forEach(r => {
        const ch = channelMap[r.customer_id] || 'UNKNOWN';
        byChannel[ch] = (byChannel[ch] || 0) + Number(r._sum.contract_value || 0);
      });
      return byChannel;
    })() : null,
  };
}
