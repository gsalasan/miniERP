import { Router } from 'express';
import { verifyToken, requireRoles } from '../middlewares/authMiddleware';
import { dashboardController } from '../controllers/dashboardController';

const router = Router();

// Project-specific dashboard (PM)
router.get('/api/v1/dashboards/projects/:projectId', verifyToken, dashboardController.getProjectDashboard.bind(dashboardController));

// Operations dashboard (Operational Manager / CEO)
router.get('/api/v1/dashboards/operations', verifyToken, requireRoles(['OPERATIONAL_MANAGER','CEO']), dashboardController.getOperationsDashboard.bind(dashboardController));

export default router;
