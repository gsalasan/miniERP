<<<<<<< HEAD
// This file is not currently used
// Materials functionality is handled in materialsService.ts
=======
import prisma from "../prisma/client";

export const getMaterials = async () => {
  return await prisma.material.findMany();
};
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987
