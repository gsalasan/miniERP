import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==================== PIPELINE STAGES ====================

/**
 * Get all pipeline stages (for kanban columns)
 */
export const getPipelineStagesService = async () => {
  const stages = await prisma.pipeline_stages.findMany({
    where: { is_active: true },
    orderBy: { stage_order: "asc" },
  });

  return stages;
};

/**
 * Create new pipeline stage
 */
export const createPipelineStageService = async (data: {
  stage_name: string;
  stage_order: number;
  color?: string;
  description?: string;
  created_by?: string;
}) => {
  const newStage = await prisma.pipeline_stages.create({
    data: {
      stage_name: data.stage_name,
      stage_order: data.stage_order,
      color: data.color || "#9E9E9E",
      description: data.description,
      created_by: data.created_by,
    },
  });

  return newStage;
};

/**
 * Update pipeline stage
 */
export const updatePipelineStageService = async (
  id: string,
  data: {
    stage_name?: string;
    stage_order?: number;
    color?: string;
    description?: string;
    is_active?: boolean;
  },
) => {
  const updated = await prisma.pipeline_stages.update({
    where: { id },
    data,
  });

  return updated;
};

/**
 * Delete pipeline stage (soft delete - set is_active = false)
 */
export const deletePipelineStageService = async (id: string) => {
  const deleted = await prisma.pipeline_stages.update({
    where: { id },
    data: { is_active: false },
  });

  return deleted;
};

// ==================== OPPORTUNITIES ====================

/**
 * Get all opportunities with filters and pagination
 */
export const getOpportunitiesService = async (params: {
  stage?: string;
  sales_pic?: string;
  customer_id?: string;
  sbu?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  expected_close_from?: Date;
  expected_close_to?: Date;
}) => {
  const {
    stage,
    sales_pic,
    customer_id,
    sbu,
    status,
    search,
    page = 1,
    limit = 50,
    expected_close_from,
    expected_close_to,
  } = params;

  const skip = (page - 1) * limit;

  const where: any = {};

  if (stage) where.stage = stage;
  if (sales_pic) where.sales_pic = sales_pic;
  if (customer_id) where.customer_id = customer_id;
  if (sbu) where.sbu = sbu;
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { opportunity_number: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (expected_close_from || expected_close_to) {
    where.expected_close_date = {};
    if (expected_close_from) where.expected_close_date.gte = expected_close_from;
    if (expected_close_to) where.expected_close_date.lte = expected_close_to;
  }

  const [opportunities, total] = await Promise.all([
    prisma.opportunities.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
            city: true,
            province: true,
          },
        },
        sales_pic_user: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                full_name: true,
                position: true,
              },
            },
          },
        },
        created_by_user: {
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
      orderBy: [{ updated_at: "desc" }],
      skip,
      take: limit,
    }),
    prisma.opportunities.count({ where }),
  ]);

  return {
    data: opportunities,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get opportunity by ID
 */
export const getOpportunityByIdService = async (id: string) => {
  const opportunity = await prisma.opportunities.findUnique({
    where: { id },
    include: {
      customer: true,
      project: {
        select: {
          id: true,
          project_name: true,
          status: true,
        },
      },
      sales_pic_user: {
        select: {
          id: true,
          email: true,
          employee: {
            select: {
              full_name: true,
              position: true,
              phone: true,
            },
          },
        },
      },
      created_by_user: {
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
      sales_orders: {
        select: {
          id: true,
          order_number: true,
          status: true,
          total_amount: true,
        },
      },
      sales_itineraries: {
        select: {
          id: true,
          visit_date: true,
          status: true,
          notes: true,
        },
        orderBy: { visit_date: "desc" },
        take: 5,
      },
    },
  });

  if (!opportunity) {
    throw new Error("Opportunity not found");
  }

  return opportunity;
};

/**
 * Create new opportunity
 */
export const createOpportunityService = async (data: {
  title: string;
  customer_id: string;
  estimated_value?: number;
  probability?: number;
  stage?: string;
  sales_pic?: string;
  sbu?: string;
  description?: string;
  expected_close_date?: Date;
  lead_score?: number;
  created_by?: string;
}) => {
  // Generate opportunity number
  const count = await prisma.opportunities.count();
  const opportunity_number = `OPP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(4, "0")}`;

  const opportunity = await prisma.opportunities.create({
    data: {
      opportunity_number,
      title: data.title,
      customer_id: data.customer_id,
      estimated_value: data.estimated_value,
      probability: data.probability || 0,
      stage: data.stage,
      sales_pic: data.sales_pic,
      sbu: data.sbu,
      description: data.description,
      expected_close_date: data.expected_close_date ? new Date(data.expected_close_date) : undefined,
      lead_score: data.lead_score || 0,
      status: "Open",
      created_by: data.created_by,
    },
    include: {
      customer: {
        select: {
          id: true,
          customer_name: true,
        },
      },
      sales_pic_user: {
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

  return opportunity;
};

/**
 * Update opportunity
 */
export const updateOpportunityService = async (
  id: string,
  data: {
    title?: string;
    customer_id?: string;
    estimated_value?: number;
    probability?: number;
    stage?: string;
    sales_pic?: string;
    sbu?: string;
    description?: string;
    expected_close_date?: Date;
    lead_score?: number;
    status?: string;
    updated_by?: string;
  },
) => {
  const updated = await prisma.opportunities.update({
    where: { id },
    data: {
      ...data,
      updated_at: new Date(),
    },
    include: {
      customer: {
        select: {
          id: true,
          customer_name: true,
        },
      },
      sales_pic_user: {
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

  return updated;
};

/**
 * Validate stage transition based on business rules
 */
const validateStageTransition = async (
  opportunity: any,
  newStageId: string,
) => {
  // Get current and new stage details
  const [currentStage, newStage] = await Promise.all([
    prisma.pipeline_stages.findUnique({ where: { id: opportunity.stage || '' } }),
    prisma.pipeline_stages.findUnique({ where: { id: newStageId } }),
  ]);

  if (!newStage) {
    throw new Error('Invalid target stage');
  }

  // If same stage, allow it
  if (opportunity.stage === newStageId) {
    return;
  }

  // Business rule: Cannot move to Won/Lost if already in Won/Lost
  const finalStages = ['Won', 'Lost'];
  if (currentStage && finalStages.includes(currentStage.stage_name)) {
    throw new Error(
      `Opportunity already in final state (${currentStage.stage_name}). Cannot move from final state.`,
    );
  }

  // Business rule: Cannot move to Won without estimation
  if (newStage.stage_name === 'Won') {
    if (opportunity.project_id) {
      // Check if linked project has approved estimation
      const estimations = await prisma.estimations.findMany({
        where: { project_id: opportunity.project_id },
        orderBy: { version: 'desc' },
        take: 1,
      });

      if (!estimations.length) {
        throw new Error(
          'Cannot mark as Won without estimation. Please create and approve estimation first.',
        );
      }

      const validStatuses = ['APPROVED', 'DISCOUNT_APPROVED'];
      if (!validStatuses.includes(estimations[0].status)) {
        throw new Error(
          `Cannot mark as Won. Estimation status is ${estimations[0].status}. Please complete estimation approval first.`,
        );
      }
    }
  }
};

/**
 * Move opportunity to different stage
 */
export const moveOpportunityStageService = async (
  id: string,
  data: {
    stage: string;
    probability?: number;
    updated_by?: string;
  },
) => {
  // Get current opportunity
  const opportunity = await prisma.opportunities.findUnique({
    where: { id },
    select: {
      id: true,
      stage: true,
      project_id: true,
      status: true,
    },
  });

  if (!opportunity) {
    throw new Error('Opportunity not found');
  }

  // Validate stage transition
  await validateStageTransition(opportunity, data.stage);

  // Get new stage info to auto-update probability and status
  const newStage = await prisma.pipeline_stages.findUnique({
    where: { id: data.stage },
  });

  // Auto-calculate probability if not provided
  let probability = data.probability;
  if (probability === undefined && newStage) {
    const probabilityMap: Record<string, number> = {
      'Leads': 10,
      'Prospect': 20,
      'Meeting Scheduled': 40,
      'Pre Sales': 50,
      'Proposal Delivered': 70,
      'Negotiation': 80,
      'Won': 100,
      'Lost': 0,
    };
    probability = probabilityMap[newStage.stage_name] || probability;
  }

  // Auto-update status based on stage
  let status = opportunity.status;
  if (newStage?.stage_name === 'Won') status = 'Won';
  if (newStage?.stage_name === 'Lost') status = 'Lost';

  const updated = await prisma.opportunities.update({
    where: { id },
    data: {
      stage: data.stage,
      probability,
      status,
      updated_by: data.updated_by,
      updated_at: new Date(),
    },
    include: {
      customer: {
        select: {
          id: true,
          customer_name: true,
        },
      },
    },
  });

  return updated;
};

/**
 * Convert opportunity to sales order
 */
export const convertOpportunityToSalesOrderService = async (
  opportunityId: string,
  data: {
    converted_by: string;
    // Additional sales order data if needed
  },
) => {
  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Get opportunity details
    const opportunity = await tx.opportunities.findUnique({
      where: { id: opportunityId },
      include: { customer: true },
    });

    if (!opportunity) {
      throw new Error("Opportunity not found");
    }

    if (opportunity.status === "Won") {
      throw new Error("Opportunity already converted");
    }

    // Create sales order
    const orderCount = await tx.sales_orders.count();
    const order_number = `SO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(orderCount + 1).padStart(4, "0")}`;

    const salesOrder = await tx.sales_orders.create({
      data: {
        order_number,
        opportunity_id: opportunityId,
        customer_id: opportunity.customer_id!,
        order_date: new Date(),
        status: "Draft",
        description: opportunity.description,
        sales_pic: opportunity.sales_pic,
        sbu: opportunity.sbu,
        created_by: data.converted_by,
        // Add more fields as needed
      },
    });

    // Update opportunity status
    const updatedOpportunity = await tx.opportunities.update({
      where: { id: opportunityId },
      data: {
        status: "Won",
        sales_order_id: salesOrder.id,
        updated_by: data.converted_by,
        updated_at: new Date(),
      },
      include: {
        customer: true,
        sales_orders: true,
      },
    });

    return {
      opportunity: updatedOpportunity,
      sales_order: salesOrder,
    };
  });

  return result;
};

/**
 * Delete opportunity (soft delete - set status to Archived)
 */
export const deleteOpportunityService = async (id: string) => {
  const deleted = await prisma.opportunities.update({
    where: { id },
    data: {
      status: "Archived",
      updated_at: new Date(),
    },
  });

  return deleted;
};

/**
 * Get pipeline summary/metrics
 */
export const getPipelineSummaryService = async (params?: {
  sales_pic?: string;
  sbu?: string;
}) => {
  const where: any = { status: { not: "Archived" } };

  if (params?.sales_pic) where.sales_pic = params.sales_pic;
  if (params?.sbu) where.sbu = params.sbu;

  const [totalOpportunities, opportunities, stages] = await Promise.all([
    prisma.opportunities.count({ where }),
    prisma.opportunities.findMany({
      where,
      select: {
        stage: true,
        estimated_value: true,
        probability: true,
        status: true,
      },
    }),
    prisma.pipeline_stages.findMany({
      where: { is_active: true },
      orderBy: { stage_order: "asc" },
    }),
  ]);

  // Calculate total pipeline value
  const totalPipelineValue = opportunities.reduce(
    (sum, opp) => sum + (Number(opp.estimated_value) || 0),
    0,
  );

  // Calculate weighted pipeline value (value * probability)
  const weightedPipelineValue = opportunities.reduce(
    (sum, opp) =>
      sum + (Number(opp.estimated_value) || 0) * ((opp.probability || 0) / 100),
    0,
  );

  // Per-stage counts and values
  const perStageStats = stages.map((stage) => {
    const stageOpps = opportunities.filter((opp) => opp.stage === stage.id);
    const stageValue = stageOpps.reduce(
      (sum, opp) => sum + (Number(opp.estimated_value) || 0),
      0,
    );

    return {
      stage_id: stage.id,
      stage_name: stage.stage_name,
      stage_order: stage.stage_order,
      count: stageOpps.length,
      total_value: stageValue,
      weighted_value: stageOpps.reduce(
        (sum, opp) =>
          sum + (Number(opp.estimated_value) || 0) * ((opp.probability || 0) / 100),
        0,
      ),
    };
  });

  // Win/Loss stats
  const wonCount = opportunities.filter((opp) => opp.status === "Won").length;
  const lostCount = opportunities.filter((opp) => opp.status === "Lost").length;
  const openCount = opportunities.filter((opp) => opp.status === "Open").length;

  return {
    total_opportunities: totalOpportunities,
    total_pipeline_value: totalPipelineValue,
    weighted_pipeline_value: weightedPipelineValue,
    per_stage_stats: perStageStats,
    status_stats: {
      open: openCount,
      won: wonCount,
      lost: lostCount,
    },
  };
};
