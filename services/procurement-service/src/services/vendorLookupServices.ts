import prisma from '../utils/prisma';

export const getAllVendorCategories = async () => {
  return await prisma.vendorCategoryLookup.findMany({ orderBy: { created_at: 'asc' } });
};

export const createVendorCategory = async (data: { value: string; label: string }) => {
  return await prisma.vendorCategoryLookup.create({ data: { value: data.value, label: data.label } });
};

export const deleteVendorCategory = async (value: string, opts?: { force?: boolean }) => {
  // Find all vendors using this category
  const used = await prisma.vendors.findMany({ where: { category: value }, select: { id: true, vendor_name: true } });
  if (used && used.length > 0) {
    if (opts?.force) {
      // If force is specified, nullify the category on referencing vendors (category is nullable in schema)
      await prisma.vendors.updateMany({ where: { category: value }, data: { category: null } as any });
      // proceed to delete using deleteMany to avoid P2025 if record was concurrently removed
      const del = await prisma.vendorCategoryLookup.deleteMany({ where: { value } as any });
      return { success: del.count > 0, forced: true, affected: used.length };
    }
    // Return the list of refs so the controller can inform the client
    return { success: false, used };
  }
  // No referencing vendors; attempt to delete. Use deleteMany to avoid throwing when record does not exist.
  const del = await prisma.vendorCategoryLookup.deleteMany({ where: { value } as any });
  if (del.count === 0) {
    return { success: false, notFound: true };
  }
  return { success: true, forced: false };
};

export const getAllVendorClassifications = async () => {
  return await prisma.vendorClassificationLookup.findMany({ orderBy: { created_at: 'asc' } });
};

export const createVendorClassification = async (data: { value: string; label: string }) => {
  return await prisma.vendorClassificationLookup.create({ data: { value: data.value, label: data.label } });
};

export const deleteVendorClassification = async (value: string, opts?: { force?: boolean }) => {
  // Find vendors using this classification
  const used = await prisma.vendors.findMany({ where: { classification: value as any }, select: { id: true, vendor_name: true } });
  if (used && used.length > 0) {
    if (opts?.force) {
      // Attempt to nullify classification on referencing vendors. This will fail if the DB column is non-nullable.
      // Caller should ensure a migration has made vendor.classification nullable before using force.
      try {
        await prisma.vendors.updateMany({ where: { classification: value as any }, data: { classification: null } as any });
        const del = await prisma.vendorClassificationLookup.deleteMany({ where: { value } as any });
        return { success: del.count > 0, forced: true, affected: used.length };
      } catch (err: unknown) {
        // Return structured error so controller can inform the client about migration/constraint issues
        return { success: false, error: (err as Error).message || String(err) } as any;
      }
    }
    // We cannot safely nullify classification by default because it's typically an enum/non-nullable in schema.
    // Return the list of refs so controller can inform the client and let caller decide how to proceed.
    return { success: false, used };
  }
  // No referencing vendors; attempt to delete. Use deleteMany to avoid throwing when record does not exist.
  const del = await prisma.vendorClassificationLookup.deleteMany({ where: { value } as any });
  if (del.count === 0) {
    return { success: false, notFound: true };
  }
  return { success: true };
};
