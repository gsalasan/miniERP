import { VendorClassification } from '@prisma/client';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateVendorData(data: Record<string, unknown>, isUpdate = false): ValidationResult {
  const errors: string[] = [];

  if (!isUpdate) {
    if (!data.vendor_name || typeof data.vendor_name !== 'string') {
      errors.push('Vendor name harus diisi dan berupa string');
    }

    if (
      data.classification === undefined ||
      !Object.values(VendorClassification).includes(
        data.classification as VendorClassification
      )
    ) {
      errors.push(
        `Classification harus diisi dan salah satu dari: ${Object.values(VendorClassification).join(', ')}`
      );
    }
  } else {
    if (data.vendor_name !== undefined && typeof data.vendor_name !== 'string') {
      errors.push('Vendor name harus berupa string');
    }

    if (data.classification !== undefined && !Object.values(VendorClassification).includes(data.classification as VendorClassification)) {
      errors.push(
        `Classification harus berupa salah satu dari: ${Object.values(VendorClassification).join(', ')}`
      );
    }
  }

  if (data.category !== undefined && typeof data.category !== 'string') {
    errors.push('Category harus berupa string');
  }

  if (data.is_preferred !== undefined && typeof data.is_preferred !== 'boolean') {
    errors.push('is_preferred harus berupa boolean');
  }

  return { isValid: errors.length === 0, errors };
}