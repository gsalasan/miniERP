import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  validateCreateMaterial,
  validateUpdateMaterial,
  validateUUID,
  validateQueryParams,
  handleErrors,
} from '../middlewares/materialsValidation.middleware';
import materialsController from '../controllers/materialsController';

const router = Router();

// Health check endpoint (public)
router.get('/health', materialsController.healthCheck);

// Materials CRUD endpoints (protected with authentication and validation)
router.get(
  '/api/v1/materials',
  verifyToken,
  validateQueryParams,
  materialsController.getMaterials
);

router.get(
  '/api/v1/materials/stats',
  verifyToken,
  materialsController.getMaterialsStats
);

router.get(
  '/api/v1/materials/filter-options',
  verifyToken,
  materialsController.getFilterOptions
);

router.get(
  '/api/v1/materials/:id',
  verifyToken,
  validateUUID,
  materialsController.getMaterialById
);

router.post(
  '/api/v1/materials',
  verifyToken,
  validateCreateMaterial,
  materialsController.createMaterial
);

router.put(
  '/api/v1/materials/:id',
  verifyToken,
  validateUUID,
  validateUpdateMaterial,
  materialsController.updateMaterial
);

router.delete(
  '/api/v1/materials/:id',
  verifyToken,
  validateUUID,
  materialsController.deleteMaterial
);

// Error handling middleware
router.use(handleErrors);

export default router;
