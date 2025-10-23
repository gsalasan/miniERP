import { CustomerStatus } from '@prisma/client';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateCustomerData(
  data: Record<string, unknown>,
  isUpdate = false
): ValidationResult {
  const errors: string[] = [];

  // Required fields untuk create
  if (!isUpdate) {
    if (!data.customer_name || typeof data.customer_name !== 'string') {
      errors.push('Nama customer harus diisi dan berupa string');
    }

    if (!data.channel || typeof data.channel !== 'string') {
      errors.push('Channel harus diisi dan berupa string');
    }

    if (!data.city || typeof data.city !== 'string') {
      errors.push('Kota harus diisi dan berupa string');
    }

    if (
      !data.status ||
      !Object.values(CustomerStatus).includes(data.status as CustomerStatus)
    ) {
      errors.push(
        `Status harus diisi dan berupa salah satu dari: ${Object.values(
          CustomerStatus
        ).join(', ')}`
      );
    }

    if (data.top_days === undefined || typeof data.top_days !== 'number') {
      errors.push('TOP days harus diisi dan berupa angka');
    }
  } else {
    // Validasi untuk update (optional fields)
    if (
      data.customer_name !== undefined &&
      typeof data.customer_name !== 'string'
    ) {
      errors.push('Nama customer harus berupa string');
    }

    if (data.channel !== undefined && typeof data.channel !== 'string') {
      errors.push('Channel harus berupa string');
    }

    if (data.city !== undefined && typeof data.city !== 'string') {
      errors.push('Kota harus berupa string');
    }

    if (
      data.status !== undefined &&
      !Object.values(CustomerStatus).includes(data.status as CustomerStatus)
    ) {
      errors.push(
        `Status harus berupa salah satu dari: ${Object.values(
          CustomerStatus
        ).join(', ')}`
      );
    }

    if (data.top_days !== undefined && typeof data.top_days !== 'number') {
      errors.push('TOP days harus berupa angka');
    }
  }

  // Optional fields validation
  if (
    data.assigned_sales_id !== undefined &&
    typeof data.assigned_sales_id !== 'string'
  ) {
    errors.push('Assigned sales ID harus berupa string');
  }

  if (
    data.credit_limit !== undefined &&
    typeof data.credit_limit !== 'number'
  ) {
    errors.push('Credit limit harus berupa angka');
  }

  if (data.no_npwp !== undefined && typeof data.no_npwp !== 'string') {
    errors.push('No NPWP harus berupa string');
  }

  if (data.sppkp !== undefined && typeof data.sppkp !== 'string') {
    errors.push('SPPKP harus berupa string');
  }

  // Validate contacts if provided
  if (data.contacts !== undefined) {
    if (!Array.isArray(data.contacts)) {
      errors.push('Contacts harus berupa array');
    } else {
      data.contacts.forEach((contact: unknown, index: number) => {
        const contactData = contact as Record<string, unknown>;

        if (!contactData.name || typeof contactData.name !== 'string') {
          errors.push(
            `Contact ${index + 1}: Nama harus diisi dan berupa string`
          );
        }

        if (
          contactData.position !== undefined &&
          typeof contactData.position !== 'string'
        ) {
          errors.push(`Contact ${index + 1}: Position harus berupa string`);
        }

        if (
          contactData.email !== undefined &&
          typeof contactData.email !== 'string'
        ) {
          errors.push(`Contact ${index + 1}: Email harus berupa string`);
        }

        if (
          contactData.phone !== undefined &&
          typeof contactData.phone !== 'string'
        ) {
          errors.push(`Contact ${index + 1}: Phone harus berupa string`);
        }

        if (
          contactData.contact_person !== undefined &&
          typeof contactData.contact_person !== 'string'
        ) {
          errors.push(
            `Contact ${index + 1}: Contact person harus berupa string`
          );
        }

        // Validate email format if provided
        if (
          contactData.email &&
          typeof contactData.email === 'string' &&
          contactData.email.trim() !== ''
        ) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(contactData.email)) {
            errors.push(`Contact ${index + 1}: Format email tidak valid`);
          }
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
