import express from 'express';
import { getSalesDashboardController } from '../controllers/dashboardController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = express.Router();

// All dashboard routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboards/sales
router.get('/sales', getSalesDashboardController);

export default router;
