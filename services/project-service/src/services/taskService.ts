import prisma from '../utils/prisma';
import { NotificationService } from '../utils/notifications';
import { randomUUID } from 'crypto';

interface CreateTaskData {
  milestoneId: string;
  taskName: string;
  assigneeId?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  parentTaskId?: string;
  taskType?: string; // e.g. 'phase' | 'activity' | 'subtask'
  weightPct?: number; // weight percentage for weighted average (0-100)
}

interface UpdateTaskData {
  name?: string;
  assigneeId?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  parentTaskId?: string | null;
  taskType?: string | null;
  weightPct?: number | null;
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
        project_id: projectId,
        milestone_id: data.milestoneId,
        name: data.taskName,
        description: data.description || '',
        assignee_id: data.assigneeId,
        start_date: data.startDate || milestone.start_date,
        due_date: data.endDate || milestone.end_date,
        status: data.status || 'TODO',
        progress: 0,
      },
    });

    // Fetch assignee separately if exists
    const assignee = task.assignee_id ? await prisma.users.findUnique({
      where: { id: task.assignee_id },
      select: {
        id: true,
        email: true,
        employees: {
          select: {
            full_name: true,
            position: true,
          },
        },
      },
    }) : null;

    const enrichedTask = {
      ...task,
      assignee,
    };

    // Send notification to assignee
    if (data.assigneeId) {
      await NotificationService.send({
        userId: data.assigneeId,
        message: `Anda mendapat tugas baru: '${data.taskName}' dalam proyek ${project.project_name}`,
        link: `/projects/${projectId}?tab=timeline`,
        type: 'info',
      });
    }

    return enrichedTask;
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
      project_id: projectId,
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
      },
      orderBy: { created_at: 'asc' },
    });

    // Get unique assignee IDs
    const assigneeIds = [...new Set(tasks.map(t => t.assignee_id).filter(Boolean))] as string[];

    // Fetch assignees if any
    const assignees = assigneeIds.length > 0 ? await prisma.users.findMany({
      where: { id: { in: assigneeIds } },
      select: {
        id: true,
        email: true,
        employees: {
          select: {
            full_name: true,
            position: true,
          },
        },
      },
    }) : [];

    // Create assignee map
    const assigneeMap = new Map(assignees.map(a => [a.id, a]));

    // Enrich tasks with assignee data
    const enrichedTasks = tasks.map(task => ({
      ...task,
      assignee: task.assignee_id ? assigneeMap.get(task.assignee_id) || null : null,
    }));

    return enrichedTasks;
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
        updateData.assignee_id = data.assigneeId || null;
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startDate) updateData.start_date = data.startDate;
      if (data.endDate) updateData.due_date = data.endDate;
      if (data.parentTaskId !== undefined) updateData.parent_task_id = data.parentTaskId;
      if (data.taskType !== undefined) updateData.task_type = data.taskType;
      if (data.weightPct !== undefined) updateData.weight_pct = data.weightPct;
    }

    // Both can update these
    if (data.status) updateData.status = data.status;
    if (data.progress !== undefined) updateData.progress = data.progress;

    const updated = await prisma.projectTask.update({
      where: { id: taskId },
      data: updateData,
    });

    // Fetch assignee separately if exists
    const assignee = updated.assignee_id ? await prisma.users.findUnique({
      where: { id: updated.assignee_id },
      select: {
        id: true,
        email: true,
        employees: {
          select: {
            full_name: true,
            position: true,
          },
        },
      },
    }) : null;

    const enrichedUpdated = {
      ...updated,
      assignee,
    };

    // Log activity if status changed
    if (data.status) {
      await prisma.projectActivity.create({
        data: {
          id: `act_${Date.now()}_${Math.random().toString(36).substring(7)}`,
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

    return enrichedUpdated;
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

  /**
   * Get Gantt chart data (full task tree + progress)
   * Returns complete task hierarchy for visualization
   */
  async getGanttData(projectId: string) {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, project_name: true },
    });

    if (!project) {
      const error: any = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    // Get all tasks for this project with relations
    const tasks = await prisma.projectTask.findMany({
      where: { project_id: projectId },
      include: {
        milestone: {
          select: {
            id: true,
            name: true,
            start_date: true,
            end_date: true,
            status: true,
          },
        },
      },
      orderBy: [
        { milestone_id: 'asc' },
        { created_at: 'asc' },
      ],
    });

    // Get unique assignee IDs
    const assigneeIds = [...new Set(tasks.map(t => t.assignee_id).filter(Boolean))] as string[];

    // Fetch assignees if any
    const assignees = assigneeIds.length > 0 ? await prisma.users.findMany({
      where: { id: { in: assigneeIds } },
      select: {
        id: true,
        email: true,
        employees: {
          select: {
            full_name: true,
            position: true,
          },
        },
      },
    }) : [];

    // Create assignee map
    const assigneeMap = new Map(assignees.map(a => [a.id, a]));

    // Enrich tasks with assignee data
    const enrichedTasks = tasks.map(task => ({
      ...task,
      assignee: task.assignee_id ? assigneeMap.get(task.assignee_id) || null : null,
    }));

    // Build hierarchical structure by parent_task_id
    const taskMap = new Map<string, any>();
    enrichedTasks.forEach(t => taskMap.set(t.id, { ...t, children: [] }));

    // Attach children to parents
    enrichedTasks.forEach((t) => {
      if (t.parent_task_id && taskMap.has(t.parent_task_id)) {
        taskMap.get(t.parent_task_id).children.push(taskMap.get(t.id));
      }
    });

    // Group tasks under milestones
    const milestones = await prisma.project_milestones.findMany({ where: { project_id: projectId }, orderBy: { start_date: 'asc' } });

    const resultMilestones = milestones.map((m) => {
      // collect top-level tasks for this milestone (no parent)
      const tasksForMilestone = enrichedTasks
        .filter(t => t.milestone_id === m.id && !t.parent_task_id)
        .map(t => taskMap.get(t.id));

      // compute weighted physical progress for milestone using leaf tasks
      const leafTasks: any[] = [];
      const collectLeaves = (node: any) => {
        if (!node) return;
        if (!node.children || node.children.length === 0) {
          leafTasks.push(node);
        } else {
          node.children.forEach((c: any) => collectLeaves(c));
        }
      };
      tasksForMilestone.forEach((root) => collectLeaves(root));

      const physicalSum = leafTasks.reduce((sum, lt) => {
        const progressPct = Number(lt.progress ?? 0);
        const weight = lt.weight_pct !== null && lt.weight_pct !== undefined ? Number(lt.weight_pct) : 100;
        return sum + (progressPct * weight) / 100;
      }, 0);
      const weightTotal = leafTasks.reduce((sum, lt) => sum + (lt.weight_pct !== null && lt.weight_pct !== undefined ? Number(lt.weight_pct) : 100), 0);

      const physicalProgressPct = weightTotal > 0 ? Math.round((physicalSum / weightTotal) * 100) : 0;

      // scheduled percent for milestone based on dates
      let scheduled_pct = 0;
      if (m.start_date && m.end_date) {
        const now = Date.now();
        const start = new Date(m.start_date).getTime();
        const end = new Date(m.end_date).getTime();
        if (end > start) {
          scheduled_pct = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
        }
      }

      // decide color class based on deviation from schedule
      const diff = physicalProgressPct - scheduled_pct;
      let scheduleClass = 'gantt-milestone-on-time';
      if (diff >= 5) scheduleClass = 'gantt-milestone-ahead';
      else if (diff >= -5 && diff < 5) scheduleClass = 'gantt-milestone-on-time';
      else if (diff >= -15 && diff < -5) scheduleClass = 'gantt-milestone-delayed-medium';
      else if (diff < -15) scheduleClass = 'gantt-milestone-delayed-severe';

      // also include status-based class
      const statusClass = `gantt-milestone-${String(m.status).toLowerCase().replace('_', '-')}`;

      return {
        id: m.id,
        title: m.name,
        start_date: m.start_date,
        end_date: m.end_date,
        progress_pct: physicalProgressPct,
        status: m.status,
        scheduled_pct,
        custom_class: `${statusClass} ${scheduleClass}`,
        children: tasksForMilestone,
      };
    });

    return { milestones: resultMilestones };
  }
}

export const taskService = new TaskService();
