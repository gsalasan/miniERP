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
    },
  });
};

export const getCustomerByIdService = async (id: string) => {
  return await prisma.customer.findUnique({
    where: { id },
    include: {
      contacts: true,
    },
  });
};

export const createCustomerService = async (data: CreateCustomerData) => {
  const { contacts, ...customerData } = data;

  return await prisma.customer.create({
    data: {
      ...customerData,
      contacts: contacts
        ? {
            create: contacts,
          }
        : undefined,
    },
    include: {
      contacts: true,
    },
  });
};

export const updateCustomerService = async (
  id: string,
  data: UpdateCustomerData
) => {
  try {
    const { contacts, ...customerData } = data;

    // Cek apakah customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: { contacts: true },
    });

    if (!existingCustomer) {
      return null;
    }

    // Update customer dan contacts dalam transaction
    return await prisma.$transaction(async tx => {
      // Update customer data
      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: customerData,
        include: {
          contacts: true,
        },
      });

      // Handle contacts update jika ada
      if (contacts) {
        // Delete existing contacts
        await tx.customerContact.deleteMany({
          where: { customer_id: id },
        });

        // Create new contacts
        if (contacts.length > 0) {
          await tx.customerContact.createMany({
            data: contacts.map(contact => ({
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
        return await tx.customer.findUnique({
          where: { id },
          include: {
            contacts: true,
          },
        });
      }

      return updatedCustomer;
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in updateCustomerService:', error);
    throw error;
  }
};

export const deleteCustomerService = async (id: string) => {
  try {
    // Cek apakah customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return null;
    }

    // Delete customer (contacts akan terhapus otomatis karena onDelete: Cascade)
    await prisma.customer.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in deleteCustomerService:', error);
    throw error;
  }
=======
import prisma from "../utils/prisma";

export const getAllCustomersService = async () => {
  return await prisma.customer.findMany();
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987
};
