import express from 'express';
import {
  getPipeline,
  movePipelineCard,
  getProjectActivities,
  createProjectActivity,
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
} from '../controllers/pipelineController';
import { presignUpload } from '../controllers/uploadController';
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

// POST /api/v1/pipeline/activities - Create a project activity (e.g., checklist actions)
router.post('/activities', createProjectActivity);

// POST /api/v1/pipeline/projects - Create a new project
router.post('/projects', createProject);

// GET /api/v1/pipeline/projects/:projectId - Get project detail
router.get('/projects/:projectId', getProjectById);

// PUT /api/v1/pipeline/projects/:projectId - Update project details
router.put('/projects/:projectId', updateProject);

// DELETE /api/v1/pipeline/projects/:projectId - Delete project
router.delete('/projects/:projectId', deleteProject);

// POST /api/v1/pipeline/uploads/presign - Generate GCS presigned upload URL
router.post('/uploads/presign', presignUpload);

export default router;