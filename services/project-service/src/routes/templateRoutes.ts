import { Router } from 'express';
import { milestoneController } from '../controllers/milestoneController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(verifyToken);

// GET /api/v1/templates/milestones?project_type=...
router.get('/milestones', milestoneController.getTemplates);

export default router;
