<<<<<<< HEAD
import prisma from '../utils/prisma';
import { CustomerStatus } from '@prisma/client';

export interface CreateCustomerData {
  customer_name: string;
  channel: string;
  city: string;
  status: CustomerStatus;
  top_days: number;
  assigned_sales_id?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  contacts?: {
    name: string;
    position?: string;
    email?: string;
    phone?: string;
    contact_person?: string;
  }[];
}

export interface UpdateCustomerData {
  customer_name?: string;
  channel?: string;
  city?: string;
  status?: CustomerStatus;
  top_days?: number;
  assigned_sales_id?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  contacts?: {
    id?: string;
    name: string;
    position?: string;
    email?: string;
    phone?: string;
    contact_person?: string;
  }[];
}

export const getAllCustomersService = async () => {
  return await prisma.customer.findMany({
    include: {
      contacts: true,
    },
    orderBy: {
      createdAt: 'desc',
=======
import prisma from "../utils/prisma";
<<<<<<< HEAD

export const getAllCustomersService = async () => {
  return await prisma.customer.findMany();
=======
import { CustomerStatus } from "@prisma/client";

export interface CreateCustomerData {
  customer_name: string;
  channel: string;
  city: string;
  status: CustomerStatus;
  top_days: number;
  assigned_sales_id?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  contacts?: {
    name: string;
    position?: string;
    email?: string;
    phone?: string;
    contact_person?: string;
  }[];
}

export interface UpdateCustomerData {
  customer_name?: string;
  channel?: string;
  city?: string;
  status?: CustomerStatus;
  top_days?: number;
  assigned_sales_id?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  contacts?: {
    id?: string;
    name: string;
    position?: string;
    email?: string;
    phone?: string;
    contact_person?: string;
  }[];
}

export const getAllCustomersService = async () => {
  return await prisma.customers.findMany({
    include: {
      customer_contacts: true,
    },
    orderBy: {
      createdAt: "desc",
>>>>>>> main
    },
  });
};

export const getCustomerByIdService = async (id: string) => {
<<<<<<< HEAD
  return await prisma.customer.findUnique({
    where: { id },
    include: {
      contacts: true,
=======
  return await prisma.customers.findUnique({
    where: { id },
    include: {
      customer_contacts: true,
>>>>>>> main
    },
  });
};

export const createCustomerService = async (data: CreateCustomerData) => {
  const { contacts, ...customerData } = data;

<<<<<<< HEAD
  return await prisma.customer.create({
    data: {
      ...customerData,
      contacts: contacts
        ? {
            create: contacts,
=======
  return await prisma.customers.create({
    data: {
      id: crypto.randomUUID(),
      ...customerData,
      updatedAt: new Date(),
      customer_contacts: contacts
        ? {
            create: contacts.map((contact) => ({
              id: crypto.randomUUID(),
              ...contact,
            })),
>>>>>>> main
          }
        : undefined,
    },
    include: {
<<<<<<< HEAD
      contacts: true,
=======
      customer_contacts: true,
>>>>>>> main
    },
  });
};

<<<<<<< HEAD
export const updateCustomerService = async (
  id: string,
  data: UpdateCustomerData
) => {
=======
export const updateCustomerService = async (id: string, data: UpdateCustomerData) => {
>>>>>>> main
  try {
    const { contacts, ...customerData } = data;

    // Cek apakah customer exists
<<<<<<< HEAD
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: { contacts: true },
=======
    const existingCustomer = await prisma.customers.findUnique({
      where: { id },
      include: { customer_contacts: true },
>>>>>>> main
    });

    if (!existingCustomer) {
      return null;
    }

    // Update customer dan contacts dalam transaction
<<<<<<< HEAD
    return await prisma.$transaction(async tx => {
      // Update customer data
      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: customerData,
        include: {
          contacts: true,
=======
    return await prisma.$transaction(async (tx) => {
      // Update customer data
      const updatedCustomer = await tx.customers.update({
        where: { id },
        data: customerData,
        include: {
          customer_contacts: true,
>>>>>>> main
        },
      });

      // Handle contacts update jika ada
      if (contacts) {
        // Delete existing contacts
<<<<<<< HEAD
        await tx.customerContact.deleteMany({
=======
        await tx.customer_contacts.deleteMany({
>>>>>>> main
          where: { customer_id: id },
        });

        // Create new contacts
        if (contacts.length > 0) {
<<<<<<< HEAD
          await tx.customerContact.createMany({
            data: contacts.map(contact => ({
=======
          await tx.customer_contacts.createMany({
            data: contacts.map((contact) => ({
              id: crypto.randomUUID(),
>>>>>>> main
              customer_id: id,
              name: contact.name,
              position: contact.position,
              email: contact.email,
              phone: contact.phone,
              contact_person: contact.contact_person,
            })),
          });
        }

        // Fetch updated customer with new contacts
<<<<<<< HEAD
        return await tx.customer.findUnique({
          where: { id },
          include: {
            contacts: true,
=======
        return await tx.customers.findUnique({
          where: { id },
          include: {
            customer_contacts: true,
>>>>>>> main
          },
        });
      }

      return updatedCustomer;
    });
  } catch (error) {
    // eslint-disable-next-line no-console
<<<<<<< HEAD
    console.error('Error in updateCustomerService:', error);
=======
    console.error("Error in updateCustomerService:", error);
>>>>>>> main
    throw error;
  }
};

export const deleteCustomerService = async (id: string) => {
  try {
    // Cek apakah customer exists
<<<<<<< HEAD
    const existingCustomer = await prisma.customer.findUnique({
=======
    const existingCustomer = await prisma.customers.findUnique({
>>>>>>> main
      where: { id },
    });

    if (!existingCustomer) {
      return null;
    }

    // Delete customer (contacts akan terhapus otomatis karena onDelete: Cascade)
<<<<<<< HEAD
    await prisma.customer.delete({
=======
    await prisma.customers.delete({
>>>>>>> main
      where: { id },
    });

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
<<<<<<< HEAD
    console.error('Error in deleteCustomerService:', error);
    throw error;
  }
=======
    console.error("Error in deleteCustomerService:", error);
    throw error;
  }
>>>>>>> main
>>>>>>> main
};
