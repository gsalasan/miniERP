import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { RfpController } from '../controllers/rfpController';
import { verifyToken, requireRoles } from '../middlewares/authMiddleware';

const router = Router();
const projectController = new ProjectController();
const rfpController = new RfpController();

// Progress summary across projects
router.get(
  '/progress-summary',
  verifyToken,
  projectController.getProgressSummary.bind(projectController)
);

// Get all projects (with optional filters)
router.get(
  '/',
  verifyToken,
  projectController.getProjects.bind(projectController)
);

// Get project managers list
router.get(
  '/project-managers',
  verifyToken,
  requireRoles(['OPERATIONAL_MANAGER', 'CEO', 'PROJECT_MANAGER']),
  projectController.getProjectManagers.bind(projectController)
);

// Get single project by ID
router.get(
  '/:projectId',
  verifyToken,
  projectController.getProject.bind(projectController)
);

// Assign PM to project
router.put(
  '/:projectId/assign-pm',
  verifyToken,
  requireRoles(['OPERATIONAL_MANAGER', 'CEO']),
  projectController.assignPm.bind(projectController)
);

// Create or update BoM
router.post(
  '/:projectId/bom',
  verifyToken,
  projectController.createOrUpdateBom.bind(projectController)
);

// RFP routes - Project Manager can create, all authenticated users can view
router.post(
  '/:projectId/rfp',
  verifyToken,
  rfpController.createRfp.bind(rfpController)
);

router.get(
  '/:projectId/rfp',
  verifyToken,
  rfpController.getRfpsByProject.bind(rfpController)
);

router.get(
  '/rfp/:rfpId',
  verifyToken,
  rfpController.getRfpById.bind(rfpController)
);

router.put(
  '/rfp/:rfpId/status',
  verifyToken,
  requireRoles(['ADMIN_PROJECT']),
  rfpController.updateRfpStatus.bind(rfpController)
);

export default router;
