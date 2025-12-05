import { PrismaClient } from '@prisma/client';
import { CreatePORequest, CreatePOFromRFPRequest, POStatus } from '../types/po.types';
import { RFPStatus } from '../types/rfp.types';

const prisma = new PrismaClient();

/**
 * Generate PO Number
 * Format: PO-YYYYMMDD-XXXX
 */
async function generatePONumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;

  // Find the last PO number for today
  const lastPO = await prisma.purchaseOrder.findFirst({
    where: {
      po_number: {
        startsWith: `PO-${datePrefix}`,
      },
    },
    orderBy: {
      po_number: 'desc',
    },
  });

  let sequence = 1;
  if (lastPO) {
    const lastSequence = parseInt(lastPO.po_number.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `PO-${datePrefix}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Create PO from regular request
 */
export async function createPOService(data: CreatePORequest) {
  const po_number = await generatePONumber();

  const po = await prisma.purchaseOrder.create({
    data: {
      po_number,
      rfp_id: data.rfp_id,
      vendor_id: data.vendor_id,
      vendor_name: data.vendor_name,
      order_date: new Date(data.order_date),
      expected_delivery: data.expected_delivery ? new Date(data.expected_delivery) : null,
      total_amount: data.total_amount,
      status: data.status || POStatus.DRAFT,
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

  return po;
}

/**
 * Create PO from RFP
 */
export async function createPOFromRFPService(data: CreatePOFromRFPRequest) {
  let createdBy = data.created_by;

  // Validate and get real user
  if (!createdBy || createdBy === '00000000-0000-0000-0000-000000000001') {
    // Try to find a user with PROCUREMENT_ADMIN role
    const procurementAdmin = await prisma.users.findFirst({
      where: {
        roles: {
          has: 'PROCUREMENT_ADMIN',
        },
        is_active: true,
      },
      select: { id: true, email: true },
    });

    if (procurementAdmin) {
      console.log(`Using PROCUREMENT_ADMIN user: ${procurementAdmin.email}`);
      createdBy = procurementAdmin.id;
    } else {
      // If no procurement admin found, use any active user
      const anyUser = await prisma.users.findFirst({
        where: { is_active: true },
        select: { id: true, email: true },
      });
      
      if (anyUser) {
        console.log(`Using first active user: ${anyUser.email}`);
        createdBy = anyUser.id;
      } else {
        throw new Error('No active users found in the system');
      }
    }
  } else {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(createdBy)) {
      throw new Error('created_by must be a valid UUID');
    }

    // Validate user exists in database
    const userExists = await prisma.users.findUnique({
      where: { id: createdBy },
      select: { id: true },
    });
    
    if (!userExists) {
      throw new Error('User not found. Please ensure you are logged in.');
    }
  }

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
    throw new Error('Cannot create PO from cancelled RFP');
  }

  // Create map of RFP items with prices
  const itemsMap = new Map(data.items.map((item) => [item.rfp_item_id, item]));

  // Calculate total amount
  let totalAmount = 0;
  const poItems = rfp.items.map((rfpItem) => {
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

  const po_number = await generatePONumber();

  // Create PO using transaction
  const po = await prisma.$transaction(async (tx) => {
    // Create PO
    const newPO = await tx.purchaseOrder.create({
      data: {
        po_number,
        rfp_id: data.rfp_id,
        vendor_id: data.vendor_id || null,
        vendor_name: data.vendor_name,
        order_date: new Date(data.order_date),
        expected_delivery: data.expected_delivery ? new Date(data.expected_delivery) : null,
        payment_terms: data.payment_terms || null,
        total_amount: totalAmount,
        status: POStatus.DRAFT,
        approval_status: 'DRAFT',
        notes: data.notes || null,
        created_by: createdBy,
        items: {
          create: poItems,
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

    // Update RFP status to PO_CREATED
    await tx.requestForPurchase.update({
      where: { id: data.rfp_id },
      data: {
        status: RFPStatus.PO_CREATED,
        processed_by: createdBy,
        processed_at: new Date(),
      },
    });

    return newPO;
  });

  return po;
}

/**
 * Get all POs
 */
export async function getAllPOsService(query: any) {
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

  const pageNum = typeof page === 'string' ? parseInt(page, 10) || 1 : Number(page) || 1;
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) || 10 : Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

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
      { po_number: { contains: search, mode: 'insensitive' } },
      { vendor_name: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get total count
  const total = await prisma.purchaseOrder.count({ where });

  // Get POs
  const pos = await prisma.purchaseOrder.findMany({
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
    take: limitNum,
    orderBy: {
      [sort_by]: sort_order,
    },
  });

  // Transform data
  const transformedPOs = pos.map((po) => ({
    ...po,
    items_count: po.items.length,
    items: undefined,
  }));

  return {
    data: transformedPOs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * Get PO by ID
 */
export async function getPOByIdService(id: string) {
  const po = await prisma.purchaseOrder.findUnique({
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

  return po;
}

/**
 * Update PO status
 */
export async function updatePOStatusService(id: string, status: POStatus) {
  const po = await prisma.purchaseOrder.update({
    where: { id },
    data: { status },
  });

  return po;
}

/**
 * Delete PO
 */
export async function deletePOService(id: string) {
  const po = await prisma.purchaseOrder.delete({
    where: { id },
  });

  return po;
}
