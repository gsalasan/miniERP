import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateSalesOrderInput {
  projectId: string;
  customerPoNumber: string;
  orderDate: string;
  topDaysAgreed?: number;
  poDocumentUrl?: string;
  createdByUserId: string;
}

class SalesOrderServices {
  /**
   * Generate unique Sales Order number
   * Format: SO-YYYYMM-XXXXX
   */
  private async generateSoNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `SO-${year}${month}`;

    // Find the latest SO number with this prefix
    const lastSo = await prisma.sales_orders.findFirst({
      where: {
        so_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        so_number: 'desc',
      },
    });

    if (lastSo) {
      // Extract the sequence number and increment
      const lastSeq = parseInt(lastSo.so_number.split('-')[2]);
      const nextSeq = String(lastSeq + 1).padStart(5, '0');
      return `${prefix}-${nextSeq}`;
    }

    // First SO of the month
    return `${prefix}-00001`;
  }

  /**
   * Create Sales Order
   * - Validates project status (must be "Proposal Delivered")
   * - Generates SO number
   * - Creates SO record
   * - Updates project status to "WON"
   * - Publishes project.won event
   */
  async createSalesOrder(input: CreateSalesOrderInput) {
    const {
      projectId,
      customerPoNumber,
      orderDate,
      topDaysAgreed,
      poDocumentUrl,
      createdByUserId,
    } = input;

    // Step 1: Fetch project and validate
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        customer: true,
        estimations: {
          where: {
            OR: [{ status: 'APPROVED' }, { status: 'DISCOUNT_APPROVED' }],
          },
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            estimation_items: true, // Include items untuk hitung subtotal
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Validate project status
    if (project.status === 'WON') {
      throw new Error('Project is already marked as WON');
    }

    if (project.status !== 'PROPOSAL_DELIVERED') {
      throw new Error(
        'Only projects with status "Proposal Delivered" can be marked as WON'
      );
    }

    // Step 2: Generate SO number
    const soNumber = await this.generateSoNumber();

    // Step 3: Calculate contract value from estimation items (HARGA JUAL items)
    let contractValue = 0;

    if (project.estimations.length > 0) {
      const estimation = project.estimations[0];
      
      // Hitung subtotal dari SUM(sell_price_at_estimation) - sudah TOTAL per line item
      const subtotal = estimation.estimation_items.reduce((sum: number, item: any) => {
        const totalPerLine = Number(item.sell_price_at_estimation || 0);
        return sum + totalPerLine;
      }, 0);

      // Ambil approved discount percentage
      const approvedDiscountPct = Number(estimation.approved_discount || 0);
      const discountAmount = subtotal * (approvedDiscountPct / 100);
      const afterDiscount = subtotal - discountAmount;
      
      // Tambah PPN 11%
      const VAT_RATE = 0.11;
      const tax = afterDiscount * VAT_RATE;
      const total = afterDiscount + tax;

      if (!Number.isNaN(total) && total > 0) {
        contractValue = total;
      } else if (subtotal > 0) {
        // Jika tidak ada discount, langsung pakai subtotal + PPN
        contractValue = subtotal + (subtotal * VAT_RATE);
      }
    }

    // Fallback ke project.contract_value jika estimation tidak ada atau kosong
    if (contractValue <= 0) {
      contractValue = project.contract_value || project.estimated_value || 0;
    }

    // Ensure contract value is not 0
    if (!contractValue || contractValue <= 0) {
      throw new Error(
        'Contract value tidak boleh kosong atau 0. Pastikan project sudah memiliki estimation yang approved atau contract value yang valid.'
      );
    }

    // Step 4: Create Sales Order
    const salesOrder = await prisma.sales_orders.create({
      data: {
        so_number: soNumber,
        project_id: projectId,
        customer_po_number: customerPoNumber,
        order_date: new Date(orderDate),
        top_days_agreed: topDaysAgreed || null,
        contract_value: contractValue,
        po_document_url: poDocumentUrl || null,
        created_by_user_id: createdByUserId,
      },
    });

    // Step 5: Update project status to WON
    await prisma.projects.update({
      where: { id: projectId },
      data: {
        status: 'WON',
        actual_close_date: new Date(),
        updated_at: new Date(),
      },
    });

    // Step 6: Create activity log
    await prisma.project_activities.create({
      data: {
        project_id: projectId,
        activity_type: 'STATUS_CHANGE',
        description: `Project marked as WON. Sales Order ${soNumber} created.`,
        performed_by: createdByUserId,
        metadata: {
          soNumber,
          customerPoNumber,
          contractValue: contractValue.toString(),
        },
      },
    });

    // Step 7: Publish project.won event (untuk didengarkan oleh Project Management Service)
    console.log('[EVENT] project.won published:', {
      projectId,
      salesOrderId: salesOrder.id,
      soNumber,
      projectName: project.project_name,
      customerName: project.customer.name,
      contractValue: contractValue.toString(),
      message: `Proyek '${project.project_name}' telah dimenangkan dan siap dimulai.`,
    });

    // TODO: Implement actual event publishing to message queue/event bus
    // await eventBus.publish('project.won', {
    //   projectId,
    //   salesOrderId: salesOrder.id,
    //   soNumber,
    //   projectName: project.project_name,
    //   message: `Proyek '${project.project_name}' telah dimenangkan dan siap dimulai.`
    // });

    // Step 8: Send notifications to Operational Manager and Support Manager
    console.log('[NOTIFICATION] Sending to Operational Manager:', {
      role: 'Operational Manager',
      message: `Proyek baru '${project.project_name}' telah dimulai.`,
      link: `/projects/${project.id}`,
      soNumber,
      customerName: project.customer.name,
    });

    console.log('[NOTIFICATION] Sending to Support Manager:', {
      role: 'Support Manager',
      message: `Proyek baru '${project.project_name}' telah dimulai. Siapkan untuk penagihan.`,
      link: `/projects/${project.id}`,
      soNumber,
      contractValue: contractValue.toString(),
    });

    // TODO: Implement notification service
    // await notificationService.send({
    //   role: 'Operational Manager',
    //   message: `Proyek baru '${project.project_name}' telah dimulai.`,
    //   link: `/projects/${project.id}`
    // });
    // await notificationService.send({
    //   role: 'Support Manager',
    //   message: `Proyek baru '${project.project_name}' telah dimulai. Siapkan untuk penagihan.`,
    //   link: `/projects/${project.id}`
    // });

    return {
      salesOrder,
      project: {
        id: project.id,
        name: project.project_name,
        status: 'WON',
      },
    };
  }

  /**
   * Get Sales Order by project ID
   */
  async getSalesOrderByProjectId(projectId: string) {
    const salesOrder = await prisma.sales_orders.findFirst({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
    });

    return salesOrder;
  }

  /**
   * Get Sales Order by ID
   */
  async getSalesOrderById(id: string) {
    const salesOrder = await prisma.sales_orders.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!salesOrder) {
      throw new Error('Sales Order not found');
    }

    return salesOrder;
  }

  /**
   * Get all Sales Orders
   */
  async getAllSalesOrders() {
    const salesOrders = await prisma.sales_orders.findMany({
      include: {
        project: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // removed debug logs to satisfy linter

    return salesOrders;
  }

  /**
   * Update Sales Order document URL only
   */
  async updateSalesOrderDocument(id: string, poDocumentUrl: string, updatedByUserId: string) {
    const so = await prisma.sales_orders.findUnique({ where: { id } });
    if (!so) {
      throw new Error('Sales Order not found');
    }

    const updated = await prisma.sales_orders.update({
      where: { id },
      data: {
        po_document_url: poDocumentUrl,
        updated_at: new Date(),
      },
    });

    // Optional: create activity log
    try {
      await prisma.project_activities.create({
        data: {
          project_id: updated.project_id,
          activity_type: 'DOCUMENT_UPDATE',
          description: 'PO document updated for Sales Order',
          performed_by: updatedByUserId,
          metadata: { salesOrderId: id, poDocumentUrl },
        },
      });
    } catch {}

    return updated;
  }
}

export default new SalesOrderServices();
