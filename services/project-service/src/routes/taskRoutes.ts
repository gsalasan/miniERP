import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Get Gantt chart data (full task tree + progress)
router.get('/:projectId/gantt', taskController.getGanttData);

// Create a task
router.post('/:projectId/tasks', taskController.createTask);

// Get all tasks for a project (with optional filters)
router.get('/:projectId/tasks', taskController.getTasks);

// Update a task (PM can edit all, assignee can edit status/progress only)
router.put('/:projectId/tasks/:taskId', taskController.updateTask);

// Update task progress only (PATCH for partial update)
router.patch('/tasks/:taskId/progress', taskController.updateTask);

// Delete a task (PM only)
router.delete('/:projectId/tasks/:taskId', taskController.deleteTask);

export default router;
