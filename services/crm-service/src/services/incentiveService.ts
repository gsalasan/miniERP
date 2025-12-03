import prisma from '../utils/prisma';

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getTierRate(achievementPercent: number) {
  // Default tiered incentive scheme (fallback)
  // <80% => 2%
  // 80-100% => 3%
  // >100% => 5%
  if (achievementPercent > 100) return 0.05;
  if (achievementPercent >= 80) return 0.03;
  return 0.02;
}

export async function simulateIncentiveForUser(userId: string, additionalSalesAmount: number) {
  const { start, end } = getMonthRange();

  // Compute current sales (orders within period)
  const actualAgg = await prisma.sales_orders.aggregate({
    _sum: { total_value: true },
    where: {
      project: { sales_user_id: userId },
      signed_date: { gte: start, lte: end },
    },
  });
  const currentSales = Number(actualAgg._sum.total_value || 0);

  // Compute target sales: derive from projects' estimated_value or contract_value for projects assigned to user in period
  const projects = await prisma.project.findMany({
    where: { sales_user_id: userId, created_at: { gte: start, lte: end } },
    select: { estimated_value: true, contract_value: true },
  });
  const targetSales = projects.reduce((s, p) => s + Number(p.estimated_value ?? p.contract_value ?? 0), 0);

  // Avoid division by zero: if target is 0, treat achievement as 0 and use base rate
  const currentAchievement = targetSales > 0 ? (currentSales / targetSales) * 100 : 0;
  const baseRate = getTierRate(currentAchievement);
  const currentIncentive = Math.round(currentSales * baseRate);

  // Simulate new sales and recompute rate
  const newSalesTotal = currentSales + Math.max(0, Number(additionalSalesAmount || 0));
  const newAchievement = targetSales > 0 ? (newSalesTotal / targetSales) * 100 : 0;
  const newRate = getTierRate(newAchievement);
  const simulatedIncentive = Math.round(newSalesTotal * newRate);

  const achievementRate = targetSales > 0 ? Number(((currentSales / targetSales) * 100).toFixed(2)) : 0;

  return {
    currentSales,
    targetSales,
    currentIncentive,
    simulatedIncentive,
    achievementRate,
    appliedRates: { currentRate: baseRate, simulatedRate: newRate },
  };
}
import prisma from '../utils/prisma';

export interface SimulateIncentivePayload {
  userId?: string;
  additionalSalesAmount: number;
}

// Default tier scheme: achievementRate (percent) -> incentive percent
// <=100% -> 2%, >100-120% -> 3%, >120% -> 5%
function getIncentivePercent(achievementPercent: number) {
  if (achievementPercent <= 100) return 0.02;
  if (achievementPercent <= 120) return 0.03;
  return 0.05;
}

export async function simulateIncentive(loggedInUser: any, payload: SimulateIncentivePayload) {
  const userId = payload.userId || loggedInUser?.id;
  if (!userId) throw new Error('userId is required');

  const additional = Number(payload.additionalSalesAmount || 0);
  if (isNaN(additional) || additional < 0) throw new Error('additionalSalesAmount must be a non-negative number');

  // Derive period: use current year for aggregation to keep simulation meaningful
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  // Current sales: sum of sales_orders.total_value for this user in the year
  const actualAgg = await prisma.sales_orders.aggregate({
    _sum: { total_value: true },
    where: { project: { sales_user_id: userId }, signed_date: { gte: startOfYear, lte: endOfYear } },
  });
  const currentSales = Number(actualAgg._sum.total_value || 0);

  // Target sales: derive from projects' estimated_value or contract_value for the year
  const projects = await prisma.project.findMany({
    where: { sales_user_id: userId, expected_close_date: { gte: startOfYear, lte: endOfYear } },
    select: { estimated_value: true, contract_value: true },
  });
  const targetSales = projects.reduce((sum, p) => sum + Number(p.estimated_value ?? p.contract_value ?? 0), 0);

  const achievementRate = targetSales > 0 ? (currentSales / targetSales) * 100 : 0;

  const currentPct = getIncentivePercent(achievementRate);
  const currentIncentive = Math.round(currentSales * currentPct);

  const simulatedSales = currentSales + additional;
  const simulatedAchievement = targetSales > 0 ? (simulatedSales / targetSales) * 100 : 0;
  const simulatedPct = getIncentivePercent(simulatedAchievement);
  const simulatedIncentive = Math.round(simulatedSales * simulatedPct);

  return {
    currentSales,
    targetSales,
    currentIncentive,
    simulatedIncentive,
    achievementRate: Number(achievementRate.toFixed(2)),
  };
}

export default { simulateIncentive };
