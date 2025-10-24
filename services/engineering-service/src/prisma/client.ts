import { PrismaClient } from '@prisma/client';

<<<<<<< HEAD
declare global {
=======

declare global {
  
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987
  var __prisma__: PrismaClient | undefined;
}

const prisma = global.__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma__ = prisma;

export default prisma;
