import prisma from '../utils/prisma';
import { VendorClassification } from '@prisma/client';

export interface CreateVendorData {
  vendor_name: string;
  category?: string;
  classification: VendorClassification;
  is_preferred?: boolean;
}

export interface UpdateVendorData {
  vendor_name?: string;
  category?: string;
  classification?: VendorClassification;
  is_preferred?: boolean;
}

export const getAllVendorsService = async () => {
  return await prisma.vendors.findMany({
    orderBy: { created_at: 'desc' },
  });
};

export const getVendorByIdService = async (id: string) => {
  return await prisma.vendors.findUnique({
    where: { id },
  });
};

export const createVendorService = async (data: CreateVendorData) => {
  return await prisma.vendors.create({
    data: {
      id: crypto.randomUUID(),
      vendor_name: data.vendor_name,
      category: data.category,
      classification: data.classification,
      is_preferred: data.is_preferred ?? false,
      updated_at: new Date(),
    },
  });
};

export const updateVendorService = async (id: string, data: UpdateVendorData) => {
  // Check existence
  const existing = await prisma.vendors.findUnique({ where: { id } });
  if (!existing) return null;

  return await prisma.vendors.update({
    where: { id },
    data: {
      ...data,
      updated_at: new Date(),
    },
  });
};

export const deleteVendorService = async (id: string) => {
  const existing = await prisma.vendors.findUnique({ where: { id } });
  if (!existing) return null;

  await prisma.vendors.delete({ where: { id } });
  return true;
};
