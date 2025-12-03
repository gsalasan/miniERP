import { Router } from 'express';
import { milestoneController } from '../controllers/milestoneController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Note: templates are exposed under /api/v1/templates via templateRoutes.
// This router focuses on project-scoped milestone operations.

// Apply milestone template to project (spec-compliant path)
router.post('/:projectId/milestones/apply-template', milestoneController.applyTemplate);

// Get all milestones for a project (with tasks)
router.get('/:projectId/milestones', milestoneController.getMilestones);

// Create a manual milestone
router.post('/:projectId/milestones', milestoneController.createMilestone);

// Update a milestone
router.put('/:projectId/milestones/:milestoneId', milestoneController.updateMilestone);

// Delete a milestone
router.delete('/:projectId/milestones/:milestoneId', milestoneController.deleteMilestone);

export default router;
