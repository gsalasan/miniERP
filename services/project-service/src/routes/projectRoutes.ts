import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { verifyToken, requireRoles } from '../middlewares/authMiddleware';

const router = Router();
const projectController = new ProjectController();

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

export default router;
