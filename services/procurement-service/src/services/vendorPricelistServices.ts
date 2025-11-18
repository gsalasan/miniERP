import prisma from '../utils/prisma';

export interface CreateVendorPriceData {
  material_id: string;
  vendor_id: string;
  price: string | number;
  currency: string;
  price_updated_at?: Date | string;
}

export interface UpdateVendorPriceData {
  material_id?: string;
  vendor_id?: string;
  price?: string | number;
  currency?: string;
  price_updated_at?: Date | string;
}

export const getAllVendorPrices = async () => {
  const results = await prisma.vendorPricelist.findMany({
    include: {
      Material: true,
      Vendor: true,
    },
    orderBy: { price_updated_at: 'desc' },
  });
  // Filter out records with missing material_id or vendor_id
  return results.filter(item => item.material_id && item.vendor_id);
};

export const getVendorPriceById = async (id: string) => {
  return await prisma.vendorPricelist.findUnique({
    where: { id },
    include: { Material: true, Vendor: true },
  });
};

export const createVendorPrice = async (data: CreateVendorPriceData) => {
  return await prisma.vendorPricelist.create({
    data: {
      id: crypto.randomUUID(),
      material_id: data.material_id,
      vendor_id: data.vendor_id,
      price: data.price as any,
      currency: data.currency,
      price_updated_at: data.price_updated_at ? new Date(data.price_updated_at) : new Date(),
    },
    include: { Material: true, Vendor: true },
  });
};

export const updateVendorPrice = async (id: string, data: UpdateVendorPriceData) => {
  const existing = await prisma.vendorPricelist.findUnique({ where: { id } });
  if (!existing) return null;

  return await prisma.vendorPricelist.update({
    where: { id },
    data: {
      material_id: data.material_id || existing.material_id,
      vendor_id: data.vendor_id || existing.vendor_id,
      price: data.price ?? existing.price,
      currency: data.currency || existing.currency,
      price_updated_at: data.price_updated_at ? new Date(data.price_updated_at) : new Date(),
    },
    include: { Material: true, Vendor: true },
  });
};

export const deleteVendorPrice = async (id: string) => {
  const existing = await prisma.vendorPricelist.findUnique({ where: { id } });
  if (!existing) return null;
  await prisma.vendorPricelist.delete({ where: { id } });
  return true;
};