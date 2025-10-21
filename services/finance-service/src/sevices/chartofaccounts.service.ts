import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllChartOfAccounts = async () => {
  const accounts = await prisma.chartOfAccounts.findMany({
    orderBy: { id: 'asc' },
  });
  return accounts;
};
