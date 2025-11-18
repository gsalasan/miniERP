import prisma from '../utils/prisma';
import { CustomerStatus } from '@prisma/client';

export interface CreateCustomerData {
  customer_name: string;
  channel: string;
  city: string;
  district?: string;
  alamat?: string;
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
  rekenings?: {
    bank_name?: string;
    account_number: string;
    account_holder?: string;
  }[];
}

export interface UpdateCustomerData {
  customer_name?: string;
  channel?: string;
  city?: string;
  district?: string;
  alamat?: string;
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
  rekenings?: {
    id?: string;
    bank_name?: string;
    account_number: string;
    account_holder?: string;
  }[];
}

export const getAllCustomersService = async () => {
  return await prisma.customers.findMany({
    include: {
      customer_contacts: true,
      customer_rekenings: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getCustomerByIdService = async (id: string) => {
  return await prisma.customers.findUnique({
    where: { id },
    include: {
      customer_contacts: true,
      customer_rekenings: true,
    },
  });
};

export const createCustomerService = async (data: CreateCustomerData) => {
  const { contacts, rekenings, ...customerData } = data;

  return await prisma.customers.create({
    data: {
      id: crypto.randomUUID(),
      ...customerData,
      updatedAt: new Date(),
      customer_contacts: contacts
        ? {
            create: contacts.map(contact => ({
              id: crypto.randomUUID(),
              ...contact,
            })),
          }
        : undefined,
      customer_rekenings: rekenings
        ? {
            create: rekenings.map(r => ({
              id: crypto.randomUUID(),
              bank_name: r.bank_name,
              account_number: r.account_number,
              account_holder: r.account_holder,
            })),
          }
        : undefined,
    },
    include: {
      customer_contacts: true,
      customer_rekenings: true,
    },
  });
};

export const updateCustomerService = async (
  id: string,
  data: UpdateCustomerData
) => {
  try {
    const { contacts, rekenings, ...customerData } = data;

    // Cek apakah customer exists
    const existingCustomer = await prisma.customers.findUnique({
      where: { id },
      include: { customer_contacts: true, customer_rekenings: true },
    });

    if (!existingCustomer) {
      return null;
    }

    // Update customer dan related entities dalam transaction
    return await prisma.$transaction(async tx => {
      // Update customer data
      await tx.customers.update({
        where: { id },
        data: customerData,
      });

      // Handle contacts update jika ada
      if (contacts) {
        // Delete existing contacts
        await tx.customer_contacts.deleteMany({ where: { customer_id: id } });

        // Create new contacts
        if (contacts.length > 0) {
          await tx.customer_contacts.createMany({
            data: contacts.map(contact => ({
              id: crypto.randomUUID(),
              customer_id: id,
              name: contact.name,
              position: contact.position,
              email: contact.email,
              phone: contact.phone,
              contact_person: contact.contact_person,
            })),
          });
        }
      }

      // Handle rekenings update jika ada
      if (rekenings) {
        // Delete existing rekenings
        await tx.customer_rekenings.deleteMany({ where: { customer_id: id } });

        // Create new rekenings
        if (rekenings.length > 0) {
          await tx.customer_rekenings.createMany({
            data: rekenings.map(r => ({
              id: crypto.randomUUID(),
              customer_id: id,
              bank_name: r.bank_name,
              account_number: r.account_number,
              account_holder: r.account_holder,
            })),
          });
        }
      }

      // Return updated customer with relations
      return await tx.customers.findUnique({
        where: { id },
        include: {
          customer_contacts: true,
          customer_rekenings: true,
        },
      });
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
    const existingCustomer = await prisma.customers.findUnique({ where: { id } });

    if (!existingCustomer) {
      return null;
    }

    // Delete customer (contacts & rekenings akan terhapus otomatis karena onDelete: Cascade)
    await prisma.customers.delete({ where: { id } });

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in deleteCustomerService:', error);
    throw error;
  }
};