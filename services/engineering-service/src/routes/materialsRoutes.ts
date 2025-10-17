import { Router } from 'express';
import materialsController from '../controllers/materialsController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

router.get('/api/v1/materials', authMiddleware, materialsController.getMaterials);

export default router;
