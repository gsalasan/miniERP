import prisma from '../utils/prisma';
import { CreateRFPRequest, UpdateRFPStatusRequest, RFPListQuery, RFPStatus } from '../types/rfp.types';

/**
 * Generate RFP Number
 * Format: RFP-YYYYMMDD-XXXX
 */
async function generateRFPNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;

  // Find the last RFP number for today
  const lastRFP = await prisma.requestForPurchase.findFirst({
    where: {
      rfp_number: {
        startsWith: `RFP-${datePrefix}`,
      },
    },
    orderBy: {
      rfp_number: 'desc',
    },
  });

  let sequence = 1;
  if (lastRFP) {
    const lastSequence = parseInt(lastRFP.rfp_number.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `RFP-${datePrefix}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Get all RFPs with filters, pagination, and sorting
 */
export async function getAllRFPsService(query: RFPListQuery) {
  const {
    status,
    project_id,
    requester_id,
    search,
    page = 1,
    limit = 10,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = query;

  // Ensure numeric values for pagination (req.query values are strings)
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;

  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (project_id) {
    where.project_id = project_id;
  }

  if (requester_id) {
    where.requester_id = requester_id;
  }

  if (search) {
    where.OR = [
      { rfp_number: { contains: search, mode: 'insensitive' } },
      { project_name: { contains: search, mode: 'insensitive' } },
      { requester_name: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get total count
  const total = await prisma.requestForPurchase.count({ where });

  // Get RFPs with items count
  const rfps = await prisma.requestForPurchase.findMany({
    where,
    include: {
      items: {
        select: {
          id: true,
        },
      },
      project: {
        select: {
          id: true,
          project_name: true,
          project_number: true,
        },
      },
      requester: {
        select: {
          id: true,
          email: true,
          employee: {
            select: {
              full_name: true,
            },
          },
        },
      },
    },
    skip,
    take: limitNum,
    orderBy: {
      [sort_by]: sort_order,
    },
  });

  // Transform data
  const transformedRFPs = rfps.map((rfp) => ({
    ...rfp,
    items_count: rfp.items.length,
    items: undefined,
  }));

  return {
    data: transformedRFPs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * Get RFP by ID with full details
 */
export async function getRFPByIdService(id: string) {
  const rfp = await prisma.requestForPurchase.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          material: {
            select: {
              id: true,
              item_name: true,
              brand: true,
              satuan: true,
            },
          },
          service: {
            select: {
              id: true,
              service_name: true,
              service_code: true,
              unit: true,
            },
          },
        },
      },
      project: {
        select: {
          id: true,
          project_name: true,
          project_number: true,
          customer_id: true,
        },
      },
      requester: {
        select: {
          id: true,
          email: true,
          employee: {
            select: {
              full_name: true,
              position: true,
              department: true,
            },
          },
        },
      },
      processor: {
        select: {
          id: true,
          email: true,
          employee: {
            select: {
              full_name: true,
            },
          },
        },
      },
      purchase_orders: {
        select: {
          id: true,
          po_number: true,
          vendor_name: true,
          order_date: true,
          total_amount: true,
          status: true,
        },
      },
    },
  });

  return rfp;
}

/**
 * Create new RFP
 */
export async function createRFPService(data: CreateRFPRequest) {
  const rfp_number = await generateRFPNumber();

  const rfp = await prisma.requestForPurchase.create({
    data: {
      rfp_number,
      project_id: data.project_id,
      project_name: data.project_name,
      requester_id: data.requester_id,
      requester_name: data.requester_name,
      notes: data.notes,
      status: RFPStatus.PENDING,
      items: {
        create: data.items.map((item) => ({
          item_name: item.item_name,
          item_type: item.item_type,
          material_id: item.material_id,
          service_id: item.service_id,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
        })),
      },
    },
    include: {
      items: true,
    },
  });

  return rfp;
}

/**
 * Update RFP status
 */
export async function updateRFPStatusService(id: string, data: UpdateRFPStatusRequest) {
  const updateData: any = {
    status: data.status,
  };

  if (data.processed_by) {
    updateData.processed_by = data.processed_by;
    updateData.processed_at = new Date();
  }

  const rfp = await prisma.requestForPurchase.update({
    where: { id },
    data: updateData,
  });

  return rfp;
}

/**
 * Delete RFP
 */
export async function deleteRFPService(id: string) {
  const rfp = await prisma.requestForPurchase.delete({
    where: { id },
  });

  return rfp;
}
