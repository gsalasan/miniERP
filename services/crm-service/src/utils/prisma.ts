import { PrismaClient } from '@prisma/client';

// Configure Prisma logs: keep errors and warnings by default; enable query logs via env
const prismaLogLevels: ('query' | 'error' | 'warn')[] = ['error', 'warn'];
if (process.env.PRISMA_LOG_QUERY === 'true') {
  prismaLogLevels.push('query');
}

const prisma = new PrismaClient({
  log: prismaLogLevels,
});

export default prisma;