import express from "express";
import {
  getPipelineStages,
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  moveOpportunityStage,
  convertOpportunity,
  deleteOpportunity,
  getPipelineSummary,
} from "../controllers/opportunityController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ==================== PIPELINE STAGES ====================

/**
 * @route   GET /api/v1/pipeline-stages
 * @desc    Get all pipeline stages (for kanban columns)
 * @access  Private
 */
router.get("/pipeline-stages", getPipelineStages);

/**
 * @route   POST /api/v1/pipeline-stages
 * @desc    Create new pipeline stage
 * @access  Private (Admin/Manager only - add permission check if needed)
 */
router.post("/pipeline-stages", createPipelineStage);

/**
 * @route   PATCH /api/v1/pipeline-stages/:id
 * @desc    Update pipeline stage
 * @access  Private (Admin/Manager only)
 */
router.patch("/pipeline-stages/:id", updatePipelineStage);

/**
 * @route   DELETE /api/v1/pipeline-stages/:id
 * @desc    Delete pipeline stage (soft delete)
 * @access  Private (Admin only)
 */
router.delete("/pipeline-stages/:id", deletePipelineStage);

// ==================== OPPORTUNITIES ====================

/**
 * @route   GET /api/v1/opportunities/summary
 * @desc    Get pipeline summary/metrics
 * @access  Private
 * @note    Must be before /:id route to avoid conflict
 */
router.get("/opportunities/summary", getPipelineSummary);

/**
 * @route   GET /api/v1/opportunities
 * @desc    Get all opportunities with filters
 * @access  Private
 */
router.get("/opportunities", getOpportunities);

/**
 * @route   GET /api/v1/opportunities/:id
 * @desc    Get opportunity by ID
 * @access  Private
 */
router.get("/opportunities/:id", getOpportunityById);

/**
 * @route   POST /api/v1/opportunities
 * @desc    Create new opportunity
 * @access  Private
 */
router.post("/opportunities", createOpportunity);

/**
 * @route   PATCH /api/v1/opportunities/:id
 * @desc    Update opportunity
 * @access  Private
 */
router.patch("/opportunities/:id", updateOpportunity);

/**
 * @route   PATCH /api/v1/opportunities/:id/move-stage
 * @desc    Move opportunity to different stage (drag & drop)
 * @access  Private
 */
router.patch("/opportunities/:id/move-stage", moveOpportunityStage);

/**
 * @route   POST /api/v1/opportunities/:id/convert
 * @desc    Convert opportunity to sales order
 * @access  Private
 */
router.post("/opportunities/:id/convert", convertOpportunity);

/**
 * @route   DELETE /api/v1/opportunities/:id
 * @desc    Delete opportunity (soft delete)
 * @access  Private
 */
router.delete("/opportunities/:id", deleteOpportunity);

export default router;
