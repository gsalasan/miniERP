import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Create a task
router.post('/:projectId/tasks', taskController.createTask);

// Get all tasks for a project (with optional filters)
router.get('/:projectId/tasks', taskController.getTasks);

// Update a task (PM can edit all, assignee can edit status/progress only)
router.put('/:projectId/tasks/:taskId', taskController.updateTask);

// Delete a task (PM only)
router.delete('/:projectId/tasks/:taskId', taskController.deleteTask);

export default router;
