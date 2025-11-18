import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireProjectManager, requireEngineeringAccess } from '../middlewares/role.middleware';
import {
  listSystemCategories,
  getSystemCategory,
  createSystemCategory,
  updateSystemCategory,
  deleteSystemCategory,
  listSubSystems,
  getSubSystem,
  createSubSystem,
  updateSubSystem,
  deleteSubSystem,
  listServiceCategories,
  getServiceCategory,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  listSpecificTypes,
  getSpecificType,
  createSpecificType,
  updateSpecificType,
  deleteSpecificType,
  listDescriptions,
  getDescription,
  createDescription,
  updateDescription,
  deleteDescription,
  listTeamRecs,
  getTeamRec,
  createTeamRec,
  updateTeamRec,
  deleteTeamRec,
  listFaseProyeks,
  getFaseProyek,
  createFaseProyek,
  updateFaseProyek,
  deleteFaseProyek,
  listSBUs,
  getSBU,
  createSBU,
  updateSBU,
  deleteSBU,
} from '../controllers/taxonomyController';

const router = Router();

// Base: /api/v1/taxonomy

// System Categories - READ: PM + PE, CUD: PM only
router.get('/api/v1/taxonomy/system-categories', verifyToken, requireEngineeringAccess, listSystemCategories);
router.get('/api/v1/taxonomy/system-categories/:id', verifyToken, requireEngineeringAccess, getSystemCategory);
router.post('/api/v1/taxonomy/system-categories', verifyToken, requireProjectManager, createSystemCategory);
router.put('/api/v1/taxonomy/system-categories/:id', verifyToken, requireProjectManager, updateSystemCategory);
router.delete('/api/v1/taxonomy/system-categories/:id', verifyToken, requireProjectManager, deleteSystemCategory);

// Sub Systems - READ: PM + PE, CUD: PM only
router.get('/api/v1/taxonomy/sub-systems', verifyToken, requireEngineeringAccess, listSubSystems);
router.get('/api/v1/taxonomy/sub-systems/:id', verifyToken, requireEngineeringAccess, getSubSystem);
router.post('/api/v1/taxonomy/sub-systems', verifyToken, requireProjectManager, createSubSystem);
router.put('/api/v1/taxonomy/sub-systems/:id', verifyToken, requireProjectManager, updateSubSystem);
router.delete('/api/v1/taxonomy/sub-systems/:id', verifyToken, requireProjectManager, deleteSubSystem);

// Nested: list/create sub-systems under a system-category
router.get('/api/v1/taxonomy/system-categories/:id/sub-systems', (req, res) => {
  req.query.system_category_id = req.params.id;
  return listSubSystems(req, res);
});
router.post('/api/v1/taxonomy/system-categories/:id/sub-systems', (req, res) => {
  req.body.system_category_id = req.params.id;
  return createSubSystem(req, res);
});

// Service Categories - READ: PM + PE, CUD: PM only
router.get('/api/v1/taxonomy/service-categories', verifyToken, requireEngineeringAccess, listServiceCategories);
router.get('/api/v1/taxonomy/service-categories/:id', verifyToken, requireEngineeringAccess, getServiceCategory);
router.post('/api/v1/taxonomy/service-categories', verifyToken, requireProjectManager, createServiceCategory);
router.put('/api/v1/taxonomy/service-categories/:id', verifyToken, requireProjectManager, updateServiceCategory);
router.delete('/api/v1/taxonomy/service-categories/:id', verifyToken, requireProjectManager, deleteServiceCategory);

// Specific Types - READ: PM + PE, CUD: PM only
router.get('/api/v1/taxonomy/specific-types', verifyToken, requireEngineeringAccess, listSpecificTypes);
router.get('/api/v1/taxonomy/specific-types/:id', verifyToken, requireEngineeringAccess, getSpecificType);
router.post('/api/v1/taxonomy/specific-types', verifyToken, requireProjectManager, createSpecificType);
router.put('/api/v1/taxonomy/specific-types/:id', verifyToken, requireProjectManager, updateSpecificType);
router.delete('/api/v1/taxonomy/specific-types/:id', verifyToken, requireProjectManager, deleteSpecificType);

// Nested: list/create specific-types under a service-category
router.get('/api/v1/taxonomy/service-categories/:id/specific-types', (req, res) => {
  req.query.category_id = req.params.id;
  return listSpecificTypes(req, res);
});
router.post('/api/v1/taxonomy/service-categories/:id/specific-types', (req, res) => {
  req.body.category_id = req.params.id;
  return createSpecificType(req, res);
});

// Descriptions - READ: PM + PE, CUD: PM only
router.get('/api/v1/taxonomy/descriptions', verifyToken, requireEngineeringAccess, listDescriptions);
router.get('/api/v1/taxonomy/descriptions/:id', verifyToken, requireEngineeringAccess, getDescription);
router.post('/api/v1/taxonomy/descriptions', verifyToken, requireProjectManager, createDescription);
router.put('/api/v1/taxonomy/descriptions/:id', verifyToken, requireProjectManager, updateDescription);
router.delete('/api/v1/taxonomy/descriptions/:id', verifyToken, requireProjectManager, deleteDescription);

// Team Recommendations - READ: PM + PE, CUD: PM only
router.get('/api/v1/taxonomy/team-recommendations', verifyToken, requireEngineeringAccess, listTeamRecs);
router.get('/api/v1/taxonomy/team-recommendations/:id', verifyToken, requireEngineeringAccess, getTeamRec);
router.post('/api/v1/taxonomy/team-recommendations', verifyToken, requireProjectManager, createTeamRec);
router.put('/api/v1/taxonomy/team-recommendations/:id', verifyToken, requireProjectManager, updateTeamRec);
router.delete('/api/v1/taxonomy/team-recommendations/:id', verifyToken, requireProjectManager, deleteTeamRec);

// Fase Proyek - READ: PM + PE, CUD: PM only
router.get('/api/v1/taxonomy/fase-proyeks', verifyToken, requireEngineeringAccess, listFaseProyeks);
router.get('/api/v1/taxonomy/fase-proyeks/:id', verifyToken, requireEngineeringAccess, getFaseProyek);
router.post('/api/v1/taxonomy/fase-proyeks', verifyToken, requireProjectManager, createFaseProyek);
router.put('/api/v1/taxonomy/fase-proyeks/:id', verifyToken, requireProjectManager, updateFaseProyek);
router.delete('/api/v1/taxonomy/fase-proyeks/:id', verifyToken, requireProjectManager, deleteFaseProyek);

// SBU - READ: PM + PE, CUD: PM only
router.get('/api/v1/taxonomy/sbus', verifyToken, requireEngineeringAccess, listSBUs);
router.get('/api/v1/taxonomy/sbus/:id', verifyToken, requireEngineeringAccess, getSBU);
router.post('/api/v1/taxonomy/sbus', verifyToken, requireProjectManager, createSBU);
router.put('/api/v1/taxonomy/sbus/:id', verifyToken, requireProjectManager, updateSBU);
router.delete('/api/v1/taxonomy/sbus/:id', verifyToken, requireProjectManager, deleteSBU);

export default router;
