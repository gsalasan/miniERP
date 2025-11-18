import { Router } from 'express';
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

// System Categories
router.get('/api/v1/taxonomy/system-categories', listSystemCategories);
router.post('/api/v1/taxonomy/system-categories', createSystemCategory);
router.get('/api/v1/taxonomy/system-categories/:id', getSystemCategory);
router.put('/api/v1/taxonomy/system-categories/:id', updateSystemCategory);
router.delete('/api/v1/taxonomy/system-categories/:id', deleteSystemCategory);

// Sub Systems
router.get('/api/v1/taxonomy/sub-systems', listSubSystems);
router.post('/api/v1/taxonomy/sub-systems', createSubSystem);
router.get('/api/v1/taxonomy/sub-systems/:id', getSubSystem);
router.put('/api/v1/taxonomy/sub-systems/:id', updateSubSystem);
router.delete('/api/v1/taxonomy/sub-systems/:id', deleteSubSystem);

// Nested: list/create sub-systems under a system-category
router.get('/api/v1/taxonomy/system-categories/:id/sub-systems', (req, res) => {
  req.query.system_category_id = req.params.id;
  return listSubSystems(req, res);
});
router.post('/api/v1/taxonomy/system-categories/:id/sub-systems', (req, res) => {
  req.body.system_category_id = req.params.id;
  return createSubSystem(req, res);
});

// Service Categories
router.get('/api/v1/taxonomy/service-categories', listServiceCategories);
router.post('/api/v1/taxonomy/service-categories', createServiceCategory);
router.get('/api/v1/taxonomy/service-categories/:id', getServiceCategory);
router.put('/api/v1/taxonomy/service-categories/:id', updateServiceCategory);
router.delete('/api/v1/taxonomy/service-categories/:id', deleteServiceCategory);

// Specific Types
router.get('/api/v1/taxonomy/specific-types', listSpecificTypes);
router.post('/api/v1/taxonomy/specific-types', createSpecificType);
router.get('/api/v1/taxonomy/specific-types/:id', getSpecificType);
router.put('/api/v1/taxonomy/specific-types/:id', updateSpecificType);
router.delete('/api/v1/taxonomy/specific-types/:id', deleteSpecificType);

// Nested: list/create specific-types under a service-category
router.get('/api/v1/taxonomy/service-categories/:id/specific-types', (req, res) => {
  req.query.category_id = req.params.id;
  return listSpecificTypes(req, res);
});
router.post('/api/v1/taxonomy/service-categories/:id/specific-types', (req, res) => {
  req.body.category_id = req.params.id;
  return createSpecificType(req, res);
});

// Descriptions
router.get('/api/v1/taxonomy/descriptions', listDescriptions);
router.post('/api/v1/taxonomy/descriptions', createDescription);
router.get('/api/v1/taxonomy/descriptions/:id', getDescription);
router.put('/api/v1/taxonomy/descriptions/:id', updateDescription);
router.delete('/api/v1/taxonomy/descriptions/:id', deleteDescription);

// Team Recommendations
router.get('/api/v1/taxonomy/team-recommendations', listTeamRecs);
router.post('/api/v1/taxonomy/team-recommendations', createTeamRec);
router.get('/api/v1/taxonomy/team-recommendations/:id', getTeamRec);
router.put('/api/v1/taxonomy/team-recommendations/:id', updateTeamRec);
router.delete('/api/v1/taxonomy/team-recommendations/:id', deleteTeamRec);

// Fase Proyek
router.get('/api/v1/taxonomy/fase-proyeks', listFaseProyeks);
router.post('/api/v1/taxonomy/fase-proyeks', createFaseProyek);
router.get('/api/v1/taxonomy/fase-proyeks/:id', getFaseProyek);
router.put('/api/v1/taxonomy/fase-proyeks/:id', updateFaseProyek);
router.delete('/api/v1/taxonomy/fase-proyeks/:id', deleteFaseProyek);

// SBU
router.get('/api/v1/taxonomy/sbus', listSBUs);
router.post('/api/v1/taxonomy/sbus', createSBU);
router.get('/api/v1/taxonomy/sbus/:id', getSBU);
router.put('/api/v1/taxonomy/sbus/:id', updateSBU);
router.delete('/api/v1/taxonomy/sbus/:id', deleteSBU);

export default router;
