import { Request, Response } from 'express';
import { taskService } from '../services/taskService';

export class TaskController {
  /**
   * Create task
   * POST /api/v1/projects/:projectId/tasks
   */
  async createTask(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const task = await taskService.createTask(projectId, req.body, userId);

      return res.status(201).json({
        success: true,
        data: task,
        message: 'Task created successfully',
      });
    } catch (error: any) {
      console.error('Error creating task:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create task',
      });
    }
  }

  /**
   * Get tasks for project
   * GET /api/v1/projects/:projectId/tasks
   */
  async getTasks(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { milestoneId, assigneeId } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tasks = await taskService.getTasks(
        projectId,
        milestoneId as string | undefined,
        assigneeId as string | undefined
      );

      return res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch tasks',
      });
    }
  }

  /**
   * Update task
   * PUT /api/v1/projects/tasks/:taskId
   */
  async updateTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const task = await taskService.updateTask(taskId, req.body, userId);

      return res.status(200).json({
        success: true,
        data: task,
        message: 'Task updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating task:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update task',
      });
    }
  }

  /**
   * Delete task
   * DELETE /api/v1/projects/tasks/:taskId
   */
  async deleteTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await taskService.deleteTask(taskId, userId);

      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to delete task',
      });
    }
  }
}

export const taskController = new TaskController();
