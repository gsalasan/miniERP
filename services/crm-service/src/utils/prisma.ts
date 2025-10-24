<<<<<<< HEAD
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
=======
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987

export default prisma;
