import express from 'express';
import {
  getPipeline,
  movePipelineCard,
  getProjectActivities,
  createProject,
  updateProject,
} from '../controllers/pipelineController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = express.Router();

// Apply auth middleware to all pipeline routes
router.use(verifyToken);

// GET /api/v1/pipeline - Get pipeline data grouped by status
router.get('/', getPipeline);

// PUT /api/v1/pipeline/move - Move a project card between pipeline columns
router.put('/move', movePipelineCard);

// GET /api/v1/pipeline/activities/:projectId - Get project activities
router.get('/activities/:projectId', getProjectActivities);

// POST /api/v1/pipeline/projects - Create a new project
router.post('/projects', createProject);

// PUT /api/v1/pipeline/projects/:projectId - Update project details
router.put('/projects/:projectId', updateProject);

export default router;