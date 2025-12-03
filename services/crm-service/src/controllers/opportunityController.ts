import { Request, Response } from "express";
import {
  getPipelineStagesService,
  createPipelineStageService,
  updatePipelineStageService,
  deletePipelineStageService,
  getOpportunitiesService,
  getOpportunityByIdService,
  createOpportunityService,
  updateOpportunityService,
  moveOpportunityStageService,
  convertOpportunityToSalesOrderService,
  deleteOpportunityService,
  getPipelineSummaryService,
} from "../services/opportunityServices";

// ==================== PIPELINE STAGES ====================

/**
 * GET /api/v1/pipeline-stages
 * Get all pipeline stages
 */
export const getPipelineStages = async (req: Request, res: Response) => {
  try {
    const stages = await getPipelineStagesService();

    return res.status(200).json({
      success: true,
      data: stages,
    });
  } catch (error) {
    console.error("Error in getPipelineStages:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get pipeline stages",
    });
  }
};

/**
 * POST /api/v1/pipeline-stages
 * Create new pipeline stage
 */
export const createPipelineStage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { stage_name, stage_order, color, description } = req.body;

    if (!stage_name || stage_order === undefined) {
      return res.status(400).json({
        success: false,
        message: "stage_name and stage_order are required",
      });
    }

    const newStage = await createPipelineStageService({
      stage_name,
      stage_order,
      color,
      description,
      created_by: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Pipeline stage created successfully",
      data: newStage,
    });
  } catch (error) {
    console.error("Error in createPipelineStage:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create pipeline stage",
    });
  }
};

/**
 * PATCH /api/v1/pipeline-stages/:id
 * Update pipeline stage
 */
export const updatePipelineStage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updated = await updatePipelineStageService(id, data);

    return res.status(200).json({
      success: true,
      message: "Pipeline stage updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updatePipelineStage:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update pipeline stage",
    });
  }
};

/**
 * DELETE /api/v1/pipeline-stages/:id
 * Delete pipeline stage
 */
export const deletePipelineStage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await deletePipelineStageService(id);

    return res.status(200).json({
      success: true,
      message: "Pipeline stage deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deletePipelineStage:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete pipeline stage",
    });
  }
};

// ==================== OPPORTUNITIES ====================

/**
 * GET /api/v1/opportunities
 * Get all opportunities with filters
 */
export const getOpportunities = async (req: Request, res: Response) => {
  try {
    const {
      stage,
      sales_pic,
      customer_id,
      sbu,
      status,
      search,
      page,
      limit,
      expected_close_from,
      expected_close_to,
    } = req.query;

    const result = await getOpportunitiesService({
      stage: stage as string,
      sales_pic: sales_pic as string,
      customer_id: customer_id as string,
      sbu: sbu as string,
      status: status as string,
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      expected_close_from: expected_close_from ? new Date(expected_close_from as string) : undefined,
      expected_close_to: expected_close_to ? new Date(expected_close_to as string) : undefined,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in getOpportunities:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get opportunities",
    });
  }
};

/**
 * GET /api/v1/opportunities/:id
 * Get opportunity by ID
 */
export const getOpportunityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const opportunity = await getOpportunityByIdService(id);

    return res.status(200).json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    console.error("Error in getOpportunityById:", error);
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Opportunity not found",
    });
  }
};

/**
 * POST /api/v1/opportunities
 * Create new opportunity
 */
export const createOpportunity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const data = req.body;

    if (!data.title || !data.customer_id) {
      return res.status(400).json({
        success: false,
        message: "title and customer_id are required",
      });
    }

    const opportunity = await createOpportunityService({
      ...data,
      created_by: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Opportunity created successfully",
      data: opportunity,
    });
  } catch (error) {
    console.error("Error in createOpportunity:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create opportunity",
    });
  }
};

/**
 * PATCH /api/v1/opportunities/:id
 * Update opportunity
 */
export const updateOpportunity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const data = req.body;

    const updated = await updateOpportunityService(id, {
      ...data,
      updated_by: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Opportunity updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateOpportunity:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update opportunity",
    });
  }
};

/**
 * PATCH /api/v1/opportunities/:id/move-stage
 * Move opportunity to different stage (drag & drop)
 */
export const moveOpportunityStage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { stage, probability } = req.body;

    if (!stage) {
      return res.status(400).json({
        success: false,
        message: "stage is required",
      });
    }

    const updated = await moveOpportunityStageService(id, {
      stage,
      probability,
      updated_by: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Opportunity stage moved successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in moveOpportunityStage:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to move opportunity stage",
    });
  }
};

/**
 * POST /api/v1/opportunities/:id/convert
 * Convert opportunity to sales order
 */
export const convertOpportunity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await convertOpportunityToSalesOrderService(id, {
      converted_by: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Opportunity converted to sales order successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in convertOpportunity:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to convert opportunity",
    });
  }
};

/**
 * DELETE /api/v1/opportunities/:id
 * Delete opportunity (soft delete)
 */
export const deleteOpportunity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await deleteOpportunityService(id);

    return res.status(200).json({
      success: true,
      message: "Opportunity deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error in deleteOpportunity:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete opportunity",
    });
  }
};

/**
 * GET /api/v1/opportunities/summary
 * Get pipeline summary/metrics
 */
export const getPipelineSummary = async (req: Request, res: Response) => {
  try {
    const { sales_pic, sbu } = req.query;

    const summary = await getPipelineSummaryService({
      sales_pic: sales_pic as string,
      sbu: sbu as string,
    });

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error in getPipelineSummary:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to get pipeline summary",
    });
  }
};
