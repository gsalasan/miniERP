// TDD-015 Extended - Gantt Service
// services/project-service/src/services/ganttService.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ProjectTasksService } from './taskService';
import { MilestoneService } from './milestoneService';

/**
 * GanttTask interface matching TDD-015 Extended
 */
export interface GanttTaskDTO {
  id: string;
  project_id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  progress: number; // 0-100
  type: 'phase' | 'activity' | 'milestone' | 'subtask';
  dependencies?: string[]; // task IDs
  custom_class?: string; // bar-red, bar-orange, bar-yellow, bar-green, bar-milestone
  weight?: number | null;
  parent?: string | null;
}

@Injectable()
export class GanttService {
  constructor(
    private prisma: PrismaService,
    private taskService: ProjectTasksService,
    private milestoneService: MilestoneService,
  ) {}

  /**
   * Get full Gantt data for a project (tasks + milestones)
   * @param projectId - Project ID
   * @returns Array of GanttTask DTOs
   */
  async getGanttData(projectId: string): Promise<GanttTaskDTO[]> {
    // Fetch all tasks and milestones for the project
    const [tasks, milestones] = await Promise.all([
      this.prisma.project_tasks.findMany({
        where: { project_id: projectId, deleted_at: null },
        include: {
          assignee: {
            include: {
              employees: true,
            },
          },
        },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.project_milestones.findMany({
        where: { project_id: projectId, deleted_at: null },
        orderBy: { start_date: 'asc' },
      }),
    ]);

    const ganttTasks: GanttTaskDTO[] = [];

    // Map milestones to Gantt format
    milestones.forEach((milestone) => {
      ganttTasks.push({
        id: `milestone-${milestone.id}`,
        project_id: projectId,
        name: `📌 ${milestone.name}`,
        start: this.formatDate(milestone.start_date),
        end: this.formatDate(milestone.end_date || milestone.start_date),
        progress: this.calculateMilestoneProgress(milestone.id, tasks),
        type: 'milestone',
        custom_class: 'bar-milestone',
        weight: null,
        parent: null,
      });
    });

    // Map tasks to Gantt format
    tasks.forEach((task) => {
      const delayData = this.calculateTaskDelay(task);
      
      ganttTasks.push({
        id: `task-${task.id}`,
        project_id: projectId,
        name: task.name,
        start: this.formatDate(task.start_date),
        end: this.formatDate(task.due_date || task.start_date),
        progress: task.progress || 0,
        type: this.mapTaskType(task.type),
        dependencies: this.buildDependencies(task),
        custom_class: delayData.colorClass,
        weight: task.weight_pct,
        parent: task.parent_task_id ? `task-${task.parent_task_id}` : null,
      });
    });

    return ganttTasks;
  }

  /**
   * Calculate milestone progress based on its tasks
   * @param milestoneId - Milestone ID
   * @param tasks - All tasks in the project
   * @returns Progress percentage (0-100)
   */
  private calculateMilestoneProgress(milestoneId: string, tasks: any[]): number {
    const milestoneTasks = tasks.filter((t) => t.milestone_id === milestoneId);
    
    if (milestoneTasks.length === 0) return 0;
    
    const totalProgress = milestoneTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
    return Math.round(totalProgress / milestoneTasks.length);
  }

  /**
   * Calculate delay and assign color class
   * TDD-015 Extended Section 4 logic:
   * - delay > 15 days → bar-red
   * - delay > 5 days → bar-orange
   * - delay < -5 days (ahead) → bar-green
   * - default → bar-yellow
   * 
   * @param task - Task entity
   * @returns Delay data with color class
   */
  private calculateTaskDelay(task: any): { delayDays: number; colorClass: string } {
    const now = new Date();
    const start = new Date(task.start_date);
    const end = new Date(task.due_date || task.start_date);
    const progress = task.progress || 0;

    // If completed, no delay
    if (progress >= 100) {
      return { delayDays: 0, colorClass: 'bar-green' };
    }

    // Calculate expected progress based on time elapsed
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const expectedProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

    // Calculate delay in days based on progress delta
    const progressDelta = progress - expectedProgress;
    const delayDays = Math.round((progressDelta / 100) * (totalDuration / (1000 * 60 * 60 * 24)));

    // Apply color logic
    let colorClass = 'bar-yellow';

    if (delayDays > 15) {
      colorClass = 'bar-red';
    } else if (delayDays > 5) {
      colorClass = 'bar-orange';
    } else if (delayDays < -5) {
      colorClass = 'bar-green';
    }

    return { delayDays, colorClass };
  }

  /**
   * Map database task type to Gantt task type
   * @param dbType - Database task type
   * @returns Gantt task type
   */
  private mapTaskType(dbType: string): GanttTaskDTO['type'] {
    const typeMap: Record<string, GanttTaskDTO['type']> = {
      PHASE: 'phase',
      ACTIVITY: 'activity',
      MILESTONE: 'milestone',
      SUBTASK: 'subtask',
    };
    return typeMap[dbType] || 'activity';
  }

  /**
   * Build dependencies array for a task
   * @param task - Task entity
   * @returns Array of dependency IDs
   */
  private buildDependencies(task: any): string[] {
    const deps: string[] = [];

    // Add milestone dependency
    if (task.milestone_id) {
      deps.push(`milestone-${task.milestone_id}`);
    }

    // Add task dependencies (if stored in JSON field)
    if (task.dependencies && Array.isArray(task.dependencies)) {
      task.dependencies.forEach((depId: string) => {
        deps.push(`task-${depId}`);
      });
    }

    return deps;
  }

  /**
   * Format date to YYYY-MM-DD
   * @param date - Date object or string
   * @returns Formatted date string
   */
  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Validate dependencies (no circular references)
   * @param taskId - Task ID
   * @param dependencies - Array of dependency IDs
   * @param allTasks - All tasks in the project
   * @returns True if valid, throws error if circular
   */
  async validateDependencies(
    taskId: string,
    dependencies: string[],
    projectId: string,
  ): Promise<boolean> {
    if (!dependencies || dependencies.length === 0) return true;

    // Fetch all tasks in project
    const tasks = await this.prisma.project_tasks.findMany({
      where: { project_id: projectId, deleted_at: null },
      select: { id: true, dependencies: true },
    });

    // Build dependency graph
    const graph = new Map<string, string[]>();
    tasks.forEach((task) => {
      const deps = task.dependencies as string[] || [];
      graph.set(task.id, deps);
    });

    // Add new dependencies to graph
    graph.set(taskId, dependencies.map((d) => d.replace('task-', '')));

    // DFS to detect cycles
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recStack.has(nodeId)) return true; // Cycle detected
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }

      recStack.delete(nodeId);
      return false;
    };

    if (hasCycle(taskId)) {
      throw new BadRequestException('Circular dependency detected');
    }

    return true;
  }

  /**
   * Update task dates and propagate to dependent tasks (Finish-to-Start)
   * @param taskId - Task ID
   * @param newStart - New start date
   * @param newEnd - New end date
   * @param projectId - Project ID
   */
  async updateTaskAndDependents(
    taskId: string,
    newStart: Date,
    newEnd: Date,
    projectId: string,
  ): Promise<void> {
    // Update the task
    await this.prisma.project_tasks.update({
      where: { id: taskId },
      data: {
        start_date: newStart,
        due_date: newEnd,
      },
    });

    // Find dependent tasks (tasks that depend on this one)
    const dependentTasks = await this.prisma.project_tasks.findMany({
      where: {
        project_id: projectId,
        deleted_at: null,
      },
    });

    // Filter tasks that have this task as dependency
    const affectedTasks = dependentTasks.filter((task) => {
      const deps = task.dependencies as string[] || [];
      return deps.includes(taskId);
    });

    // Update each dependent task (Finish-to-Start logic)
    for (const task of affectedTasks) {
      const duration = task.due_date.getTime() - task.start_date.getTime();
      const newDependentStart = new Date(newEnd.getTime() + 24 * 60 * 60 * 1000); // +1 day
      const newDependentEnd = new Date(newDependentStart.getTime() + duration);

      await this.updateTaskAndDependents(
        task.id,
        newDependentStart,
        newDependentEnd,
        projectId,
      );
    }
  }
}
