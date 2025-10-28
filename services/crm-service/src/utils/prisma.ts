import { PrismaClient } from "@prisma/client";

<<<<<<< HEAD
const prisma = new PrismaClient();
=======
const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});
>>>>>>> main

export default prisma;
