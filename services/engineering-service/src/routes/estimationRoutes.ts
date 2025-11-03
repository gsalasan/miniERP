import { Router } from 'express';
import * as estimationController from '../controllers/estimationController';

const router = Router();

router.get('/api/v1/estimations', estimationController.getEstimations);
router.get('/api/v1/estimations/:id', estimationController.getEstimationById);
router.post('/api/v1/estimations', estimationController.createEstimation);
router.put('/api/v1/estimations/:id', estimationController.updateEstimation);
router.delete('/api/v1/estimations/:id', estimationController.deleteEstimation);

export default router;
