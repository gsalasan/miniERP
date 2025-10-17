import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import materialsController from '../controllers/materialsController';

const router = Router();

// Public endpoint - no auth required
router.get('/api/v1/materials', materialsController.getMaterials);

export default router;
