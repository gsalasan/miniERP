import { VendorClassification } from '@prisma/client';
import prisma from '../utils/prisma';

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

export interface VendorQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  classification?: VendorClassification;
  is_preferred?: boolean;
}

export class VendorService {
  async createVendor(data: CreateVendorData) {
    return await prisma.vendors.create({
      data: {
        vendor_name: data.vendor_name,
        category: data.category,
        classification: data.classification,
        is_preferred: data.is_preferred || false,
      },
    });
  }

  async getAllVendors(options: VendorQueryOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      classification,
      is_preferred,
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { vendor_name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (classification) {
      where.classification = classification;
    }

    if (is_preferred !== undefined) {
      where.is_preferred = is_preferred;
    }

    const [vendors, total] = await Promise.all([
      prisma.vendors.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.vendors.count({ where }),
    ]);

    return {
      data: vendors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorById(id: string) {
    return await prisma.vendors.findUnique({
      where: { id },
    });
  }

  async updateVendor(id: string, data: UpdateVendorData) {
    return await prisma.vendors.update({
      where: { id },
      data,
    });
  }

  async deleteVendor(id: string) {
    return await prisma.vendors.delete({
      where: { id },
    });
  }

  async getVendorStats() {
    const [total, byClassification, preferredCount] = await Promise.all([
      prisma.vendors.count(),
      prisma.vendors.groupBy({
        by: ['classification'],
        _count: true,
      }),
      prisma.vendors.count({
        where: { is_preferred: true },
      }),
    ]);

    return {
      total,
      preferred: preferredCount,
      byClassification: byClassification.reduce((acc, item) => {
        acc[item.classification] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}