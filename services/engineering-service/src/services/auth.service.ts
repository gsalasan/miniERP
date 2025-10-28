<<<<<<< HEAD
import prisma from "../prisma/client";

export const getMaterials = async () => {
  return await prisma.material.findMany();
};
=======
// This file is not currently used
// Materials functionality is handled in materialsService.ts
>>>>>>> main
