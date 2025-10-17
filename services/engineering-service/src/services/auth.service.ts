import prisma from "../prisma/client";

export const getMaterials = async () => {
  return await prisma.material.findMany();
};
