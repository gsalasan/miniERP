import { PrismaClient } from '@prisma/client';

<<<<<<< HEAD

declare global {
  
=======
declare global {
>>>>>>> main
  var __prisma__: PrismaClient | undefined;
}

const prisma = global.__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__prisma__ = prisma;

export default prisma;
