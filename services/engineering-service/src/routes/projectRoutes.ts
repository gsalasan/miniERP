import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import { verifyToken } from '../middlewares/auth.middleware';
import {
  validateCreateProject,
  validateUpdateProject,
  validateUUID,
  handleErrors,
} from '../middlewares/projectValidation.middleware';

const router = Router();

// Health check endpoint (public)
router.get('/api/v1/projects/health', (req, res) => res.json({ status: 'ok' }));

// Projects CRUD endpoints (protected with authentication and validation)
router.get('/api/v1/projects', verifyToken, projectController.getProjects);
router.get(
  '/api/v1/projects/:id',
  verifyToken,
  validateUUID,
  projectController.getProjectById
);
router.post(
  '/api/v1/projects',
  verifyToken,
  validateCreateProject,
  projectController.createProject
);
router.put(
  '/api/v1/projects/:id',
  verifyToken,
  validateUUID,
  validateUpdateProject,
  projectController.updateProject
);
router.delete(
  '/api/v1/projects/:id',
  verifyToken,
  validateUUID,
  projectController.deleteProject
);

// Error handling middleware
router.use(handleErrors);

export default router;