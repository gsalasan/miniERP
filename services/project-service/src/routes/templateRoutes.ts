import { Router } from 'express';
import { milestoneController } from '../controllers/milestoneController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

// GET /api/v1/templates/milestones?project_type=...
router.get('/milestones', milestoneController.getTemplates);

// POST /api/v1/templates/milestones
router.post('/milestones', milestoneController.createTemplate);

// PUT /api/v1/templates/milestones/:templateId
router.put('/milestones/:templateId', milestoneController.updateTemplate);

// DELETE /api/v1/templates/milestones/:templateId
router.delete('/milestones/:templateId', milestoneController.deleteTemplate);

export default router;
