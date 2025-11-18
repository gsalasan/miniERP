import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireProjectManager, requireEngineeringAccess } from '../middlewares/role.middleware';
import {
  createService,
  getServices,
  getServiceById,
  getServiceByCode,
  updateService,
  deleteService,
  hardDeleteService,
  restoreService,
  getServiceStats,
  searchServices,
} from '../controllers/serviceController';

const router = Router();

// Service routes - READ operations: PM + PE can access
router.get('/api/v1/services', verifyToken, requireEngineeringAccess, getServices);
router.get('/api/v1/services/stats', verifyToken, requireEngineeringAccess, getServiceStats);
router.get('/api/v1/services/search', verifyToken, requireEngineeringAccess, searchServices); // FITUR 3.2.B: Search services for autocomplete - MUST BE BEFORE :id
router.get('/api/v1/services/:id', verifyToken, requireEngineeringAccess, getServiceById);
router.get('/api/v1/services/code/:code', verifyToken, requireEngineeringAccess, getServiceByCode);

// CREATE: PM and PE can create
router.post('/api/v1/services', verifyToken, requireEngineeringAccess, createService);

// UPDATE, DELETE operations: PM only
router.put('/api/v1/services/:id', verifyToken, requireProjectManager, updateService);
router.delete('/api/v1/services/:id', verifyToken, requireProjectManager, deleteService);
router.delete('/api/v1/services/:id/hard', verifyToken, requireProjectManager, hardDeleteService);
router.patch('/api/v1/services/:id/restore', verifyToken, requireProjectManager, restoreService);

export default router;