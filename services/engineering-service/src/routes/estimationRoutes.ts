import { Router } from 'express';
import * as estimationController from '../controllers/estimationController';
import { requireRole, requireProjectManager, requireProjectEngineer, requireEngineeringAccess, requireApprovalManager } from '../middlewares/role.middleware';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Users/Engineers routes
router.get('/api/v1/users/engineers', verifyToken, requireEngineeringAccess, estimationController.getEngineers);

// Queue management routes
router.get(
  '/api/v1/estimations/queue',
  verifyToken,
  requireEngineeringAccess,
  estimationController.getEstimationQueue
);
router.put(
  '/api/v1/estimations/:id/assign',
  verifyToken,
  requireProjectManager,
  estimationController.assignEstimation
);
router.put(
  '/api/v1/estimations/:id/start',
  verifyToken,
  requireEngineeringAccess,
  estimationController.startEstimationWork
);

// Standard CRUD routes
router.get('/api/v1/estimations', verifyToken, requireEngineeringAccess, estimationController.getEstimations);
router.post(
  '/api/v1/estimations/calculate',
  verifyToken,
  requireEngineeringAccess,
  estimationController.calculateEstimation
);
router.post(
  '/api/v1/estimations/calculate-modular',
  verifyToken,
  requireEngineeringAccess,
  estimationController.calculateModularEstimation
);
router.get('/api/v1/estimations/:id', verifyToken, requireEngineeringAccess, estimationController.getEstimationById);
router.post('/api/v1/estimations', verifyToken, requireProjectManager, estimationController.createEstimation);
router.put('/api/v1/estimations/:id/draft', verifyToken, requireEngineeringAccess, estimationController.saveDraft);
router.put(
  '/api/v1/estimations/:id/submit',
  verifyToken,
  requireProjectEngineer,
  estimationController.submitEstimation
);
router.put(
  '/api/v1/estimations/:id/decide',
  verifyToken,
  requireApprovalManager,
  estimationController.decideOnEstimation
);
router.post(
  '/api/v1/estimations/:id/send-to-crm',
  verifyToken,
  requireApprovalManager,
  estimationController.sendEstimationToCRM
);
router.put('/api/v1/estimations/:id', verifyToken, requireProjectManager, estimationController.updateEstimation);
router.delete('/api/v1/estimations/:id', verifyToken, requireProjectManager, estimationController.deleteEstimation);

export default router;