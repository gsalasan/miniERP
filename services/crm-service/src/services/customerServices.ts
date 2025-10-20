import prisma from "../utils/prisma";

export type CreateCustomerInput = {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export const getAllCustomersService = async () => {
  return await prisma.customer.findMany();
};

export const getCustomerByIdService = async (id: string) => {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw { status: 404, message: "Customer not found" };
  return customer;
};

export const createCustomerService = async (payload: CreateCustomerInput) => {
  if (!payload.name || !payload.email) throw { status: 400, message: "name and email required" };

  const created = await prisma.customer.create({ data: payload as any });
  return created;
};

export const updateCustomerService = async (id: string, payload: UpdateCustomerInput) => {
  const exists = await prisma.customer.findUnique({ where: { id } });
  if (!exists) throw { status: 404, message: "Customer not found" };
  const updated = await prisma.customer.update({ where: { id }, data: payload as any });
  return updated;
};
