import { PrismaClient } from '@prisma/client';

// Singleton pattern untuk PrismaClient
const globalForPrisma = global as unknown as { prisma: PrismaClient };

console.log("🔧 Creating Prisma Client instance...");

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

console.log("✅ Prisma Client created");

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
