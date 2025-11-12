let PrismaClient: any | null = null;
let prismaInstance: any | null = null;

export function getPrisma() {
  if (!PrismaClient) {
    // Load Prisma client at runtime to avoid crashing at import time
    // In production, client is available at @prisma/client
    // In dev, it is also resolved from node_modules
    // If require fails, we defer the error until actual DB access
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const prismaModule = require('@prisma/client');
      PrismaClient = prismaModule.PrismaClient;
    } catch (err) {
      throw new Error('Prisma client not available. Ensure @prisma/client is generated.');
    }
  }
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

