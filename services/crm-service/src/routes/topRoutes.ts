import express from "express";
import {
  changeTOP,
  getTOPHistory,
  approveTOPChange,
  applyScheduledChanges,
} from "../controllers/topController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

/**
 * @route   POST /api/v1/customers/:id/top
 * @desc    Change customer TOP (Terms of Payment)
 * @access  Private (authenticated users)
 */
router.post('/customers/:id/top', changeTOP);

/**
 * @route   GET /api/v1/customers/:id/top-history
 * @desc    Get TOP change history for a customer
 * @access  Private (authenticated users)
 */
router.get('/customers/:id/top-history', getTOPHistory);

/**
 * @route   POST /api/v1/top-changes/:historyId/approve
 * @desc    Approve or reject a pending TOP change request
 * @access  Private (Finance/Admin only)
 */
router.post('/top-changes/:historyId/approve', approveTOPChange);

/**
 * @route   POST /api/v1/top-changes/apply-scheduled
 * @desc    Apply scheduled TOP changes (for cron job)
 * @access  Private (internal/system only)
 */
router.post('/top-changes/apply-scheduled', applyScheduledChanges);

export default router;
