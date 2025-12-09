import prisma from '../utils/prisma';
import { CreateWORequest, CreateWOFromRFPRequest, WOStatus } from '../types/wo.types';
import { RFPStatus } from '../types/rfp.types';

/**
 * Generate WO Number
 * Format: WO-YYYYMMDD-XXXX
 */
async function generateWONumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;

  // Find the last WO number for today
  const lastWO = await prisma.workOrder.findFirst({
    where: {
      wo_number: {
        startsWith: `WO-${datePrefix}`,
      },
    },
    orderBy: {
      wo_number: 'desc',
    },
  });

  let sequence = 1;
  if (lastWO) {
    const lastSequence = parseInt(lastWO.wo_number.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `WO-${datePrefix}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Create WO from regular request
 */
export async function createWOService(data: CreateWORequest) {
  const wo_number = await generateWONumber();

  const wo = await prisma.workOrder.create({
    data: {
      wo_number,
      rfp_id: data.rfp_id,
      vendor_id: data.vendor_id,
      vendor_name: data.vendor_name,
      order_date: new Date(data.order_date),
      expected_completion: data.expected_completion ? new Date(data.expected_completion) : null,
      total_amount: data.total_amount,
      status: data.status || WOStatus.DRAFT,
      payment_terms: data.payment_terms,
      notes: data.notes,
      created_by: data.created_by,
      items: {
        create: data.items.map((item) => ({
          item_name: item.item_name,
          item_type: item.item_type,
          material_id: item.material_id,
          service_id: item.service_id,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes,
        })),
      },
    },
    include: {
      items: true,
      rfp: true,
    },
  });

  return wo;
}

/**
 * Create WO from RFP
 */
export async function createWOFromRFPService(data: CreateWOFromRFPRequest) {
  // Get RFP data with items
  const rfp = await prisma.requestForPurchase.findUnique({
    where: { id: data.rfp_id },
    include: {
      items: {
        include: {
          material: true,
          service: true,
        },
      },
    },
  });

  if (!rfp) {
    throw new Error('RFP not found');
  }

  if (rfp.status === RFPStatus.CANCELLED) {
    throw new Error('Cannot create WO from cancelled RFP');
  }

  // Create map of RFP items with prices
  const itemsMap = new Map(data.items.map((item) => [item.rfp_item_id, item]));

  // Calculate total amount
  let totalAmount = 0;
  const woItems = rfp.items.map((rfpItem) => {
    const itemData = itemsMap.get(rfpItem.id);
    if (!itemData) {
      throw new Error(`Price not provided for item: ${rfpItem.item_name}`);
    }

    const totalPrice = Number(rfpItem.quantity) * itemData.unit_price;
    totalAmount += totalPrice;

    return {
      item_name: rfpItem.item_name,
      item_type: rfpItem.item_type,
      material_id: rfpItem.material_id,
      service_id: rfpItem.service_id,
      quantity: rfpItem.quantity,
      unit: rfpItem.unit,
      unit_price: itemData.unit_price,
      total_price: totalPrice,
      notes: itemData.notes || rfpItem.notes,
    };
  });

  const wo_number = await generateWONumber();

  // Create WO using transaction
  const wo = await prisma.$transaction(async (tx) => {
    // Create WO
    const newWO = await tx.workOrder.create({
      data: {
        wo_number,
        rfp_id: data.rfp_id,
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name,
        order_date: new Date(data.order_date),
        expected_completion: data.expected_completion ? new Date(data.expected_completion) : null,
        total_amount: totalAmount,
        status: WOStatus.DRAFT,
        payment_terms: data.payment_terms,
        notes: data.notes,
        created_by: data.created_by,
        items: {
          create: woItems,
        },
      },
      include: {
        items: true,
        rfp: {
          include: {
            items: true,
          },
        },
      },
    });

    // Update RFP status to PO_CREATED (using PO_CREATED for both PO and WO)
    await tx.requestForPurchase.update({
      where: { id: data.rfp_id },
      data: {
        status: RFPStatus.PO_CREATED,
        processed_by: data.created_by,
        processed_at: new Date(),
      },
    });

    return newWO;
  });

  return wo;
}

/**
 * Get all WOs
 */
export async function getAllWOsService(query: any) {
  const {
    status,
    rfp_id,
    vendor_id,
    search,
    page = 1,
    limit = 10,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = query;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (rfp_id) {
    where.rfp_id = rfp_id;
  }

  if (vendor_id) {
    where.vendor_id = vendor_id;
  }

  if (search) {
    where.OR = [
      { wo_number: { contains: search, mode: 'insensitive' } },
      { vendor_name: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get total count
  const total = await prisma.workOrder.count({ where });

  // Get WOs
  const wos = await prisma.workOrder.findMany({
    where,
    include: {
      items: {
        select: {
          id: true,
        },
      },
      rfp: {
        select: {
          id: true,
          rfp_number: true,
          project_name: true,
        },
      },
      creator: {
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
    take: limit,
    orderBy: {
      [sort_by]: sort_order,
    },
  });

  // Transform data
  const transformedWOs = wos.map((wo) => ({
    ...wo,
    items_count: wo.items.length,
    items: undefined,
  }));

  return {
    data: transformedWOs,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get WO by ID
 */
export async function getWOByIdService(id: string) {
  const wo = await prisma.workOrder.findUnique({
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
      rfp: {
        select: {
          id: true,
          rfp_number: true,
          project_name: true,
          requester_name: true,
        },
      },
      creator: {
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
  });

  return wo;
}

/**
 * Update WO status
 */
export async function updateWOStatusService(id: string, status: WOStatus) {
  const wo = await prisma.workOrder.update({
    where: { id },
    data: { status },
  });

  return wo;
}

/**
 * Delete WO
 */
export async function deleteWOService(id: string) {
  const wo = await prisma.workOrder.delete({
    where: { id },
  });

  return wo;
}
