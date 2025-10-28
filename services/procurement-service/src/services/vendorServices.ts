import prisma from "../utils/prisma";
import { VendorClassification } from "../utils/validation";

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
    orderBy: {
      created_at: "desc",
    },
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      category: data.category as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      classification: data.classification as any,
      is_preferred: data.is_preferred || false,
    },
  });
};

export const updateVendorService = async (id: string, data: UpdateVendorData) => {
  try {
    // Cek apakah vendor exists
    const existingVendor = await prisma.vendors.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return null;
    }

    // Update vendor data
    const updatedVendor = await prisma.vendors.update({
      where: { id },
      data: {
        vendor_name: data.vendor_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        category: data.category as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        classification: data.classification as any,
        is_preferred: data.is_preferred,
      },
    });

    return updatedVendor;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in updateVendorService:", error);
    throw error;
  }
};

export const deleteVendorService = async (id: string) => {
  try {
    // Cek apakah vendor exists
    const existingVendor = await prisma.vendors.findUnique({
      where: { id },
    });

    if (!existingVendor) {
      return null;
    }

    // Delete vendor
    await prisma.vendors.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in deleteVendorService:", error);
    throw error;
  }
};
