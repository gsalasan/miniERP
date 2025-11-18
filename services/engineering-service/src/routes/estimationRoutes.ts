import { Router } from 'express';
import * as estimationController from '../controllers/estimationController';

const router = Router();

// Get estimations (filter by projectId via query param or get by project)
router.get('/api/v1/estimations', estimationController.getEstimations);
router.get('/api/v1/projects/:projectId/estimations', estimationController.getEstimationsByProject);
router.get('/api/v1/estimations/:id', estimationController.getEstimationById);

// Create estimation request (dari CRM)
router.post('/api/v1/estimations', estimationController.createEstimation);

// Update/delete (untuk Engineering team nanti)
router.put('/api/v1/estimations/:id', estimationController.updateEstimation);
router.delete('/api/v1/estimations/:id', estimationController.deleteEstimation);

export default router;
