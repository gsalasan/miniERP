import prisma from '../utils/prisma';
import { NotificationService } from '../utils/notifications';

interface CreateTaskData {
  milestoneId: string;
  taskName: string;
  assigneeId?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface UpdateTaskData {
  name?: string;
  assigneeId?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
}

export class TaskService {
  /**
   * Create task
   */
  async createTask(projectId: string, data: CreateTaskData, userId: string) {
    // Check if user is PM
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      const error: any = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (project.pm_user_id !== userId) {
      const error: any = new Error(
        'Forbidden: Only the assigned PM can create tasks'
      );
      error.statusCode = 403;
      throw error;
    }

    // Verify milestone belongs to project
    const milestone = await prisma.projectMilestone.findUnique({
      where: { id: data.milestoneId },
    });

    if (!milestone || milestone.project_id !== projectId) {
      const error: any = new Error('Invalid milestone for this project');
      error.statusCode = 400;
      throw error;
    }

    // Create task
    const task = await prisma.projectTask.create({
      data: {
        project: { connect: { id: projectId } },
        milestone: { connect: { id: data.milestoneId } },
        name: data.taskName,
        description: data.description || '',
        assignee: data.assigneeId
          ? { connect: { id: data.assigneeId } }
          : undefined,
        status: data.status || 'TODO',
        start_date: data.startDate || milestone.start_date,
        due_date: data.endDate || milestone.end_date,
        progress: 0,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                full_name: true,
                position: true,
              },
            },
          },
        },
      },
    });

    // Send notification to assignee
    if (data.assigneeId) {
      await NotificationService.send({
        userId: data.assigneeId,
        message: `Anda mendapat tugas baru: '${data.taskName}' dalam proyek ${project.project_name}`,
        link: `/projects/${projectId}?tab=timeline`,
        type: 'info',
      });
    }

    return task;
  }

  /**
   * Get tasks
   */
  async getTasks(
    projectId: string,
    milestoneId?: string,
    assigneeId?: string
  ) {
    const where: any = {
      milestone: {
        project_id: projectId,
      },
    };

    if (milestoneId) {
      where.milestone_id = milestoneId;
    }

    if (assigneeId) {
      where.assignee_id = assigneeId;
    }

    const tasks = await prisma.projectTask.findMany({
      where,
      include: {
        milestone: {
          select: {
            id: true,
            name: true,
            project_id: true,
          },
        },
        assignee: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                full_name: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return tasks;
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, data: UpdateTaskData, userId: string) {
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: {
        milestone: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!task) {
      const error: any = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const project = task.milestone.project;

    // Check permission: PM or task assignee can update
    const isPM = project.pm_user_id === userId;
    const isAssignee = task.assignee_id === userId;

    if (!isPM && !isAssignee) {
      const error: any = new Error(
        'Forbidden: Only PM or task assignee can update task'
      );
      error.statusCode = 403;
      throw error;
    }

    // Assignee can only update status, progress, and notes
    const updateData: any = {};

    if (isPM) {
      // PM can update everything
      if (data.name) updateData.name = data.name;
      if (data.assigneeId !== undefined) {
        updateData.assignee = data.assigneeId
          ? { connect: { id: data.assigneeId } }
          : { disconnect: true };
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startDate) updateData.start_date = data.startDate;
      if (data.endDate) updateData.due_date = data.endDate;
    }

    // Both can update these
    if (data.status) updateData.status = data.status;
    if (data.progress !== undefined) updateData.progress = data.progress;

    const updated = await prisma.projectTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                full_name: true,
                position: true,
              },
            },
          },
        },
      },
    });

    // Log activity if status changed
    if (data.status) {
      await prisma.projectActivity.create({
        data: {
          project_id: project.id,
          activity_type: 'NOTE_ADDED',
          description: `Task "${task.name}" status updated to ${data.status}`,
          performed_by: userId,
          metadata: {
            task_id: taskId,
            old_status: task.status,
            new_status: data.status,
          },
        },
      });
    }

    return updated;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, userId: string) {
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: {
        milestone: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!task) {
      const error: any = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const project = task.milestone.project;

    if (project.pm_user_id !== userId) {
      const error: any = new Error(
        'Forbidden: Only the assigned PM can delete tasks'
      );
      error.statusCode = 403;
      throw error;
    }

    await prisma.projectTask.delete({
      where: { id: taskId },
    });

    return true;
  }
}

export const taskService = new TaskService();
