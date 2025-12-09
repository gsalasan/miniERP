import { PrismaClient } from '@prisma/client';

// Single Prisma client instance for this service
const prisma = new PrismaClient();

export default prisma;
