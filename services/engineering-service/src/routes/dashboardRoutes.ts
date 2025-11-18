import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireEngineeringAccess } from '../middlewares/role.middleware';
import { getEngineeringDashboard } from '../controllers/dashboardController';

const router = express.Router();

// GET /api/v1/dashboards/engineering - PM + PE can access
router.get('/api/v1/dashboards/engineering', verifyToken, requireEngineeringAccess, getEngineeringDashboard);

export default router;
