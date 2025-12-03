import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ConvertOpportunityRequest {
  opportunityId: string;
  projectName?: string;
  topDays?: number;
  signedDate?: string;
  idempotencyKey?: string;
}

interface ConvertOpportunityResponse {
  soId: string;
  soNumber: string;
  projectId: string | null;
  estimationId: string | null;
  pdfUrl: string | null;
  status: 'CREATED' | 'PENDING_PROJECT' | 'ERROR';
  message?: string;
}

class SalesOrderService {
  /**
   * Generate SO number with format: SO/YYYY/NNNNN
   */
  private async generateSONumber(): Promise<string> {
    const year = new Date().getFullYear();
    
    // Get next sequence number
    const result = await prisma.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval('public.so_number_seq')
    `;
    
    const sequence = Number(result[0].nextval);
    const paddedSequence = sequence.toString().padStart(5, '0');
    
    return `SO/${year}/${paddedSequence}`;
  }

  /**
   * Convert WON Opportunity to Sales Order
   */
  async convertOpportunityToSalesOrder(
    request: ConvertOpportunityRequest,
    userId: string,
    token: string
  ): Promise<ConvertOpportunityResponse> {
    const { opportunityId, projectName, topDays, signedDate } = request;

    // 1. Validate opportunity exists and is WON
    const opportunity = await prisma.opportunities.findUnique({
      where: { id: opportunityId },
      include: {
        customer: true,
        pipeline_stage: true,
      },
    });

    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    if (opportunity.pipeline_stage?.stage_name !== 'Won') {
      throw new Error('Only WON opportunities can be converted to Sales Order');
    }

    // 2. Check if SO already exists for this opportunity
    const existingSO = await prisma.sales_orders.findFirst({
      where: { opportunity_id: opportunityId },
    });

    if (existingSO) {
      return {
        soId: existingSO.id,
        soNumber: existingSO.so_number,
        projectId: null,
        estimationId: null,
        pdfUrl: existingSO.pdf_url,
        status: existingSO.status as any,
        message: 'Sales Order already exists for this opportunity',
      };
    }

    // 3. Generate SO number and create SO record atomically
    let soId: string;
    let soNumber: string;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Generate SO number
        soNumber = await this.generateSONumber();

        // Create Sales Order with DRAFT status
        const salesOrder = await tx.sales_orders.create({
          data: {
            so_number: soNumber,
            customer_po_number: soNumber,
            opportunity: { connect: { id: opportunityId } },
            ...(opportunity.customer_id
              ? { customer: { connect: { id: opportunity.customer_id } } }
              : {}),
            project_name: projectName || opportunity.title,
            sbu: opportunity.sbu || 'GENERAL',
            total_value: opportunity.estimated_value || 0,
            top_days: topDays || 30,
            signed_date: signedDate ? new Date(signedDate) : new Date(),
            valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            ...(opportunity.sales_pic
              ? { sales_pic_user: { connect: { id: opportunity.sales_pic } } }
              : {}),
            status: 'Draft',
            created_by_user: { connect: { id: userId } },
          },
        });

        return salesOrder;
      });

      soId = result.id;
      soNumber = result.so_number;

      console.log(`[SalesOrderService] Created SO ${soNumber} for opportunity ${opportunityId}`);
    } catch (error: any) {
      // Check if it's a unique constraint violation
      if (error.code === '23505' && error.constraint === 'sales_orders_opportunity_id_unique') {
        // Race condition - another request created SO
        const existingSO = await prisma.sales_orders.findFirst({
          where: { opportunity_id: opportunityId },
        });

        if (existingSO) {
          return {
            soId: existingSO.id,
            soNumber: existingSO.so_number,
            projectId: null,
            estimationId: null,
            pdfUrl: existingSO.pdf_url,
            status: existingSO.status as any,
            message: 'Sales Order already exists for this opportunity',
          };
        }
      }

      throw error;
    }

    // 4. Update SO status to Signed (skip Engineering service for now)
    await prisma.sales_orders.update({
      where: { id: soId },
      data: {
        status: 'Signed',
      },
    });

    console.log(`[SalesOrderService] Sales Order ${soNumber} created and signed`);

    return {
      soId,
      soNumber,
      projectId: null,
      estimationId: null,
      pdfUrl: null,
      status: 'CREATED',
      message: 'Sales Order created successfully',
    };
  }

  /**
   * Get Sales Order by ID
   */
  async getSalesOrderById(soId: string) {
    return await prisma.sales_orders.findUnique({
      where: { id: soId },
      include: {
        customer: true,
        opportunity: true,
      },
    });
  }

  /**
   * Get Sales Order by Opportunity ID
   */
  async getSalesOrderByOpportunity(opportunityId: string) {
    return await prisma.sales_orders.findFirst({
      where: { opportunity_id: opportunityId },
      include: {
        customer: true,
        opportunity: true,
      },
    });
  }
}

export default new SalesOrderService();
