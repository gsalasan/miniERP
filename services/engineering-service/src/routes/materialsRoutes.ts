import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
<<<<<<< HEAD
import {
  validateCreateMaterial,
  validateUpdateMaterial,
  validateUUID,
  validateQueryParams,
  handleErrors,
} from '../middlewares/materialsValidation.middleware';
=======
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987
import materialsController from '../controllers/materialsController';

const router = Router();

<<<<<<< HEAD
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
=======
router.get('/api/v1/materials', materialsController.getMaterials);
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987

export default router;
