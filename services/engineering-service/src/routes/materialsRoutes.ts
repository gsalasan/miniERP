import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireProjectManager, requireEngineeringAccess } from '../middlewares/role.middleware';
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
// READ operations: PM + PE can access
router.get(
  '/api/v1/materials',
  verifyToken,
  requireEngineeringAccess,
  validateQueryParams,
  materialsController.getMaterials
);

router.get(
  '/api/v1/materials/stats',
  verifyToken,
  requireEngineeringAccess,
  materialsController.getMaterialsStats
);

router.get(
  '/api/v1/materials/filter-options',
  verifyToken,
  requireEngineeringAccess,
  materialsController.getFilterOptions
);

// FITUR 3.2.C: Search materials (for autocomplete) - MUST BE BEFORE :id route
router.get(
  '/api/v1/materials/search',
  verifyToken,
  requireEngineeringAccess,
  materialsController.searchMaterials
);

router.get(
  '/api/v1/materials/:id',
  verifyToken,
  requireEngineeringAccess,
  validateUUID,
  materialsController.getMaterialById
);

// CREATE, UPDATE, DELETE operations: PM and PE can create
router.post(
  '/api/v1/materials',
  verifyToken,
  requireEngineeringAccess,
  validateCreateMaterial,
  materialsController.createMaterial
);

// FITUR 3.2.C: Create material with vendor and initial price (for calculator)
router.post(
  '/api/v1/materials/with-vendor',
  verifyToken,
  requireEngineeringAccess,
  materialsController.createMaterialWithVendor
);

router.put(
  '/api/v1/materials/:id',
  verifyToken,
  requireProjectManager,
  validateUUID,
  validateUpdateMaterial,
  materialsController.updateMaterial
);

router.delete(
  '/api/v1/materials/:id',
  verifyToken,
  requireProjectManager,
  validateUUID,
  materialsController.deleteMaterial
);

// Error handling middleware
router.use(handleErrors);

export default router;