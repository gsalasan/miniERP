import { Router } from 'express';
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
} from '../controllers/serviceController';

const router = Router();

// Service routes
router.post('/api/v1/services', createService); // Create a new service
router.get('/api/v1/services', getServices); // Get all services with filtering and pagination
router.get('/api/v1/services/stats', getServiceStats); // Get service statistics
router.get('/api/v1/services/:id', getServiceById); // Get service by ID
router.get('/api/v1/services/code/:code', getServiceByCode); // Get service by service code
router.put('/api/v1/services/:id', updateService); // Update service by ID
router.delete('/api/v1/services/:id', deleteService); // Soft delete service by ID
router.delete('/api/v1/services/:id/hard', hardDeleteService); // Hard delete service by ID
router.patch('/api/v1/services/:id/restore', restoreService); // Restore service by ID

export default router;
