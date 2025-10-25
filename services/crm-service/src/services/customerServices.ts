import prisma from "../utils/prisma";

export const getAllCustomersService = async () => {
  return await prisma.customer.findMany();
};
