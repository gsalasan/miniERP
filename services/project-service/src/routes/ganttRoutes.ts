// TDD-015 Extended - Gantt Routes
// services/project-service/src/routes/ganttRoutes.ts

import { Router } from 'express';
import { GanttController } from '../controllers/ganttController';

const router = Router();
const ganttController = new GanttController();

/**
 * GET /projects/:id/gantt
 * Get full Gantt data (tasks + milestones)
 */
router.get('/projects/:id/gantt', (req, res) => ganttController.getGanttData(req, res));

/**
 * PATCH /tasks/:taskId
 * Update task (start, end, progress, dependencies, weight, parent)
 */
router.patch('/tasks/:taskId', (req, res) => ganttController.updateTask(req, res));

/**
 * PATCH /tasks/:taskId/progress
 * Fast progress-only update
 */
router.patch('/tasks/:taskId/progress', (req, res) => ganttController.updateTaskProgress(req, res));

/**
 * POST /projects/:id/tasks
 * Create task with full Gantt fields
 */
router.post('/projects/:id/tasks', (req, res) => ganttController.createTask(req, res));

/**
 * POST /projects/:id/milestones
 * Create milestone
 */
router.post('/projects/:id/milestones', (req, res) => ganttController.createMilestone(req, res));

/**
 * PATCH /milestones/:milestoneId
 * Update milestone
 */
router.patch('/milestones/:milestoneId', (req, res) => ganttController.updateMilestone(req, res));

export default router;
