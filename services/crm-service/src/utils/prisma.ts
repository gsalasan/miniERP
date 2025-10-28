import { PrismaClient } from '@prisma/client';

<<<<<<< HEAD
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
=======
<<<<<<< HEAD
const prisma = new PrismaClient();
=======
const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});
>>>>>>> main
>>>>>>> main

export default prisma;
