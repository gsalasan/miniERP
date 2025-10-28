<<<<<<< HEAD
import prisma from '../utils/prisma';
=======
import prisma from "../utils/prisma";
>>>>>>> main

export interface CreateCustomerContactData {
  customer_id: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
}

export interface UpdateCustomerContactData {
  name?: string;
  position?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
}

export const getAllCustomerContactsService = async () => {
<<<<<<< HEAD
  return await prisma.customerContact.findMany({
    include: {
      customer: {
=======
  return await prisma.customer_contacts.findMany({
    include: {
      customers: {
>>>>>>> main
        select: {
          id: true,
          customer_name: true,
          channel: true,
          city: true,
          status: true,
        },
      },
    },
    orderBy: {
<<<<<<< HEAD
      name: 'asc',
=======
      name: "asc",
>>>>>>> main
    },
  });
};

export const getCustomerContactByIdService = async (id: string) => {
<<<<<<< HEAD
  return await prisma.customerContact.findUnique({
    where: { id },
    include: {
      customer: {
=======
  return await prisma.customer_contacts.findUnique({
    where: { id },
    include: {
      customers: {
>>>>>>> main
        select: {
          id: true,
          customer_name: true,
          channel: true,
          city: true,
          status: true,
        },
      },
    },
  });
};

<<<<<<< HEAD
export const getCustomerContactsByCustomerIdService = async (
  customerId: string
) => {
  return await prisma.customerContact.findMany({
    where: { customer_id: customerId },
    include: {
      customer: {
=======
export const getCustomerContactsByCustomerIdService = async (customerId: string) => {
  return await prisma.customer_contacts.findMany({
    where: { customer_id: customerId },
    include: {
      customers: {
>>>>>>> main
        select: {
          id: true,
          customer_name: true,
          channel: true,
          city: true,
          status: true,
        },
      },
    },
    orderBy: {
<<<<<<< HEAD
      name: 'asc',
=======
      name: "asc",
>>>>>>> main
    },
  });
};

<<<<<<< HEAD
export const createCustomerContactService = async (
  data: CreateCustomerContactData
) => {
  // Check if customer exists
  const customer = await prisma.customer.findUnique({
=======
export const createCustomerContactService = async (data: CreateCustomerContactData) => {
  // Check if customer exists
  const customer = await prisma.customers.findUnique({
>>>>>>> main
    where: { id: data.customer_id },
  });

  if (!customer) {
<<<<<<< HEAD
    throw new Error('Foreign key constraint failed: Customer not found');
  }

  return await prisma.customerContact.create({
    data: {
=======
    throw new Error("Foreign key constraint failed: Customer not found");
  }

  return await prisma.customer_contacts.create({
    data: {
      id: crypto.randomUUID(),
>>>>>>> main
      customer_id: data.customer_id,
      name: data.name,
      position: data.position,
      email: data.email,
      phone: data.phone,
      contact_person: data.contact_person,
    },
    include: {
<<<<<<< HEAD
      customer: {
=======
      customers: {
>>>>>>> main
        select: {
          id: true,
          customer_name: true,
          channel: true,
          city: true,
          status: true,
        },
      },
    },
  });
};

<<<<<<< HEAD
export const updateCustomerContactService = async (
  id: string,
  data: UpdateCustomerContactData
) => {
  try {
    // Check if contact exists
    const existingContact = await prisma.customerContact.findUnique({
=======
export const updateCustomerContactService = async (id: string, data: UpdateCustomerContactData) => {
  try {
    // Check if contact exists
    const existingContact = await prisma.customer_contacts.findUnique({
>>>>>>> main
      where: { id },
    });

    if (!existingContact) {
      return null;
    }

<<<<<<< HEAD
    return await prisma.customerContact.update({
      where: { id },
      data,
      include: {
        customer: {
=======
    return await prisma.customer_contacts.update({
      where: { id },
      data,
      include: {
        customers: {
>>>>>>> main
          select: {
            id: true,
            customer_name: true,
            channel: true,
            city: true,
            status: true,
          },
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
<<<<<<< HEAD
    console.error('Error in updateCustomerContactService:', error);
=======
    console.error("Error in updateCustomerContactService:", error);
>>>>>>> main
    throw error;
  }
};

export const deleteCustomerContactService = async (id: string) => {
  try {
    // Check if contact exists
<<<<<<< HEAD
    const existingContact = await prisma.customerContact.findUnique({
=======
    const existingContact = await prisma.customer_contacts.findUnique({
>>>>>>> main
      where: { id },
    });

    if (!existingContact) {
      return null;
    }

<<<<<<< HEAD
    await prisma.customerContact.delete({
=======
    await prisma.customer_contacts.delete({
>>>>>>> main
      where: { id },
    });

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
<<<<<<< HEAD
    console.error('Error in deleteCustomerContactService:', error);
=======
    console.error("Error in deleteCustomerContactService:", error);
>>>>>>> main
    throw error;
  }
};
