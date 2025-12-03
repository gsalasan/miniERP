// TDD-015 Extended - Gantt Controller
// services/project-service/src/controllers/ganttController.ts

import { Request, Response } from 'express';
import { GanttService } from '../services/ganttService';
import { ProjectTasksService } from '../services/taskService';

export class GanttController {
  private ganttService: GanttService;
  private taskService: ProjectTasksService;

  constructor() {
    this.ganttService = new GanttService();
    this.taskService = new ProjectTasksService();
  }

  /**
   * GET /projects/:id/gantt
   * Get full Gantt data (tasks + milestones)
   */
  async getGanttData(req: Request, res: Response) {
    try {
      const { id: projectId } = req.params;

      const ganttData = await this.ganttService.getGanttData(projectId);

      res.json({
        success: true,
        data: ganttData,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch Gantt data',
      });
    }
  }

  /**
   * PATCH /tasks/:taskId
   * Update task (start, end, progress, dependencies, weight, parent)
   */
  async updateTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { start, end, progress, dependencies, weight, parent } = req.body;
      const userId = (req as any).user?.id || 'system';

      // Build update data
      const updateData: any = {};

      if (start) {
        updateData.start_date = new Date(start).toISOString();
      }

      if (end) {
        updateData.due_date = new Date(end).toISOString();
      }

      if (progress !== undefined) {
        updateData.progress = Math.max(0, Math.min(100, progress));
      }

      if (dependencies !== undefined) {
        // Validate dependencies first
        const task = await this.taskService.getTask(taskId);
        if (task) {
          await this.ganttService.validateDependencies(
            taskId,
            dependencies,
            task.project_id
          );
        }
        updateData.dependencies = dependencies;
      }

      if (weight !== undefined) {
        updateData.weight_pct = weight;
      }

      if (parent !== undefined) {
        updateData.parent_task_id = parent ? parent.replace('task-', '') : null;
      }

      // Update task
      const updatedTask = await this.taskService.updateTask(
        taskId,
        updateData,
        userId
      );

      // If start/end changed, propagate to dependent tasks
      if (start || end) {
        const newStart = new Date(start || updatedTask.start_date);
        const newEnd = new Date(end || updatedTask.due_date);
        
        await this.ganttService.updateTaskAndDependents(
          taskId,
          newStart,
          newEnd,
          updatedTask.project_id
        );
      }

      res.json({
        success: true,
        data: updatedTask,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update task',
      });
    }
  }

  /**
   * PATCH /tasks/:taskId/progress
   * Fast progress-only update (optimized endpoint)
   */
  async updateTaskProgress(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      const { progress } = req.body;
      const userId = (req as any).user?.id || 'system';

      if (progress === undefined || typeof progress !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Progress must be a number between 0 and 100',
        });
      }

      const clampedProgress = Math.max(0, Math.min(100, progress));

      const updatedTask = await this.taskService.updateTask(
        taskId,
        { progress: clampedProgress },
        userId
      );

      res.json({
        success: true,
        data: updatedTask,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update task progress',
      });
    }
  }

  /**
   * POST /projects/:id/tasks
   * Create task with full Gantt fields
   */
  async createTask(req: Request, res: Response) {
    try {
      const { id: projectId } = req.params;
      const {
        name,
        start,
        end,
        type,
        milestone_id,
        dependencies,
        weight,
        parent,
      } = req.body;
      const userId = (req as any).user?.id || 'system';

      // Validate required fields
      if (!name || !start || !end) {
        return res.status(400).json({
          success: false,
          message: 'name, start, and end are required',
        });
      }

      // Validate dependencies if provided
      if (dependencies && dependencies.length > 0) {
        await this.ganttService.validateDependencies(
          'temp-id', // Will be replaced after creation
          dependencies,
          projectId
        );
      }

      // Create task
      const taskData = {
        taskName: name,
        startDate: start,
        endDate: end,
        taskType: type || 'ACTIVITY',
        milestoneId: milestone_id,
        dependencies: dependencies || [],
        weightPct: weight,
        parentTaskId: parent ? parent.replace('task-', '') : undefined,
      };

      const createdTask = await this.taskService.createTask(
        projectId,
        taskData,
        userId
      );

      res.status(201).json({
        success: true,
        data: createdTask,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create task',
      });
    }
  }

  /**
   * POST /projects/:id/milestones
   * Create milestone
   */
  async createMilestone(req: Request, res: Response) {
    try {
      const { id: projectId } = req.params;
      const { name, start, end, status } = req.body;
      const userId = (req as any).user?.id || 'system';

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'name is required',
        });
      }

      const milestoneData = {
        name,
        startDate: start,
        endDate: end,
        status: status || 'PLANNED',
      };

      const createdMilestone = await this.ganttService.milestoneService.createMilestone(
        projectId,
        milestoneData,
        userId
      );

      res.status(201).json({
        success: true,
        data: createdMilestone,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create milestone',
      });
    }
  }

  /**
   * PATCH /milestones/:milestoneId
   * Update milestone
   */
  async updateMilestone(req: Request, res: Response) {
    try {
      const { milestoneId } = req.params;
      const { name, start, end, status } = req.body;
      const userId = (req as any).user?.id || 'system';

      const updateData: any = {};

      if (name) updateData.name = name;
      if (start) updateData.start_date = new Date(start).toISOString();
      if (end) updateData.end_date = new Date(end).toISOString();
      if (status) updateData.status = status;

      const updatedMilestone = await this.ganttService.milestoneService.updateMilestone(
        milestoneId,
        updateData,
        userId
      );

      res.json({
        success: true,
        data: updatedMilestone,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update milestone',
      });
    }
  }
}
