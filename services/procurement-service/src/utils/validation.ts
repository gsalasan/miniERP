export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export enum VendorClassification {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  ENTERPRISE = "ENTERPRISE",
  GOVERNMENT = "GOVERNMENT",
}

export function validateVendorData(
  data: Record<string, unknown>,
  isUpdate = false
): ValidationResult {
  const errors: string[] = [];

  // Required fields untuk create
  if (!isUpdate) {
    if (!data.vendor_name || typeof data.vendor_name !== "string") {
      errors.push("Nama vendor harus diisi dan berupa string");
    }

    if (
      !data.classification ||
      !Object.values(VendorClassification).includes(data.classification as VendorClassification)
    ) {
      errors.push(
        `Classification harus diisi dan berupa salah satu dari: ${Object.values(VendorClassification).join(", ")}`
      );
    }
  } else {
    // Validasi untuk update (optional fields)
    if (data.vendor_name !== undefined && typeof data.vendor_name !== "string") {
      errors.push("Nama vendor harus berupa string");
    }

    if (
      data.classification !== undefined &&
      !Object.values(VendorClassification).includes(data.classification as VendorClassification)
    ) {
      errors.push(
        `Classification harus berupa salah satu dari: ${Object.values(VendorClassification).join(", ")}`
      );
    }
  }

  // Optional fields validation
  if (data.category !== undefined && typeof data.category !== "string") {
    errors.push("Category harus berupa string");
  }

  if (data.is_preferred !== undefined && typeof data.is_preferred !== "boolean") {
    errors.push("Is preferred harus berupa boolean");
  }

  // Business rules validation
  if (data.vendor_name && typeof data.vendor_name === "string") {
    if (data.vendor_name.trim().length < 2) {
      errors.push("Nama vendor harus minimal 2 karakter");
    }
    if (data.vendor_name.trim().length > 100) {
      errors.push("Nama vendor maksimal 100 karakter");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
