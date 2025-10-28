import { z } from 'zod';

export const createVendorSchema = z.object({
  vendor_name: z.string().min(1, 'Vendor name is required'),
  category: z.string().optional(),
  classification: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE', 'GOVERNMENT']),
  is_preferred: z.boolean().optional().default(false),
});

export const updateVendorSchema = z.object({
  vendor_name: z.string().min(1, 'Vendor name is required').optional(),
  category: z.string().optional(),
  classification: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE', 'GOVERNMENT']).optional(),
  is_preferred: z.boolean().optional(),
});

export const queryVendorSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  classification: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE', 'GOVERNMENT']).optional(),
  is_preferred: z.string().optional(),
});