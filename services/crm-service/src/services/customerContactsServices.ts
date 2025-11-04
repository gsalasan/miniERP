import prisma from '../utils/prisma';

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
  return await prisma.customer_contacts.findMany({
    include: {
      customers: {
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
      name: 'asc',
    },
  });
};

export const getCustomerContactByIdService = async (id: string) => {
  return await prisma.customer_contacts.findUnique({
    where: { id },
    include: {
      customers: {
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

export const getCustomerContactsByCustomerIdService = async (
  customerId: string
) => {
  return await prisma.customer_contacts.findMany({
    where: { customer_id: customerId },
    include: {
      customers: {
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
      name: 'asc',
    },
  });
};

export const createCustomerContactService = async (
  data: CreateCustomerContactData
) => {
  // Check if customer exists
  const customer = await prisma.customers.findUnique({
    where: { id: data.customer_id },
  });

  if (!customer) {
    throw new Error('Foreign key constraint failed: Customer not found');
  }

  return await prisma.customer_contacts.create({
    data: {
      id: crypto.randomUUID(),
      customer_id: data.customer_id,
      name: data.name,
      position: data.position,
      email: data.email,
      phone: data.phone,
      contact_person: data.contact_person,
    },
    include: {
      customers: {
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

export const updateCustomerContactService = async (
  id: string,
  data: UpdateCustomerContactData
) => {
  try {
    // Check if contact exists
    const existingContact = await prisma.customer_contacts.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return null;
    }

    return await prisma.customer_contacts.update({
      where: { id },
      data,
      include: {
        customers: {
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
    console.error('Error in updateCustomerContactService:', error);
    throw error;
  }
};

export const deleteCustomerContactService = async (id: string) => {
  try {
    // Check if contact exists
    const existingContact = await prisma.customer_contacts.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return null;
    }

    await prisma.customer_contacts.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in deleteCustomerContactService:', error);
    throw error;
  }
};
