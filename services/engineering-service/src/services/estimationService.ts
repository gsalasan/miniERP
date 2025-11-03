import { PrismaClient, Estimation } from '@prisma/client';

const prisma = new PrismaClient();

export const getEstimations = async () => {
  return prisma.estimation.findMany({
    include: { project: true, items: true },
  });
};

export const getEstimationById = async (id: string) => {
  return prisma.estimation.findUnique({
    where: { id },
    include: { project: true, items: true },
  });
};

export const createEstimation = async (data: Estimation) => {
  return prisma.estimation.create({ data });
};

export const updateEstimation = async (
  id: string,
  data: Partial<Estimation>
) => {
  return prisma.estimation.update({ where: { id }, data });
};

export const deleteEstimation = async (id: string) => {
  return prisma.estimation.delete({ where: { id } });
};
