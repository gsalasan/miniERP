import prisma from '../utils/prisma';
import { NotificationService } from '../utils/notifications';
import { randomUUID } from 'crypto';

interface CreateMilestoneData {
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export class MilestoneService {
  private normalizeDate(input?: string) {
    if (!input) return undefined as unknown as string | undefined;
    // Accept plain YYYY-MM-DD and convert to ISO, otherwise pass-through
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return new Date(input).toISOString();
    }
    return input;
  }

  /**
   * Auto-generate 5 default milestones on project creation
   * TDD-015 Extended Section 5: Milestone Auto-generation
   * 
   * Generated milestones:
   * 1. Project Kickoff (+0 days from project start)
   * 2. 30% Progress (+60 days)
   * 3. 70% Progress (+150 days)
   * 4. Handover (+300 days)
   * 5. Project Closed (+330 days)
   * 
   * @param projectId - Project ID
   * @param projectStartDate - Project start date
   * @returns Array of created milestones
   */
  async generateDefaultMilestones(
    projectId: string,
    projectStartDate: Date
  ) {
    const defaultMilestones = [
      { name: 'Project Kickoff', offsetDays: 0, type: 'milestone' },
      { name: '30% Progress', offsetDays: 60, type: 'milestone' },
      { name: '70% Progress', offsetDays: 150, type: 'milestone' },
      { name: 'Handover', offsetDays: 300, type: 'milestone' },
      { name: 'Project Closed', offsetDays: 330, type: 'milestone' },
    ];

    const createdMilestones = [];

    for (const def of defaultMilestones) {
      const startDate = new Date(projectStartDate);
      startDate.setDate(startDate.getDate() + def.offsetDays);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1); // Milestone spans 1 day

      const milestone = await prisma.project_milestones.create({
        data: {
          id: randomUUID(),
          project_id: projectId,
          name: def.name,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: 'PLANNED',
        },
      });

      createdMilestones.push(milestone);
    }

    // Log activity
    await prisma.project_activities.create({
      data: {
        id: randomUUID(),
        project_id: projectId,
        activity_type: 'NOTE_ADDED',
        description: `Auto-generated 5 default milestones`,
        performed_by: 'system',
        metadata: {
          milestones_count: createdMilestones.length,
        },
      },
    });

    return createdMilestones;
  }

  /**
   * Apply milestone template to project
   */
  async applyTemplate(
    projectId: string,
    templateId: string,
    userId: string
  ) {
    // Check if user is PM of the project
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      const error: any = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (project.pm_user_id !== userId) {
      const error: any = new Error(
        'Forbidden: Only the assigned PM can apply templates'
      );
      error.statusCode = 403;
      throw error;
    }

    // Get template
    const template = await prisma.milestone_templates.findUnique({
      where: { id: parseInt(templateId) },
    });

    if (!template) {
      const error: any = new Error('Template not found');
      error.statusCode = 404;
      throw error;
    }

    // Parse milestones from JSON
    const milestoneDefs = template.milestones as any[];

    // Create milestones in transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdMilestones = [];
      let currentDate = new Date();

      for (const def of milestoneDefs) {
        const startDate = new Date(currentDate);
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + (def.duration_days || 7));

        const milestone = await tx.project_milestones.create({
          data: {
            id: randomUUID(),
            project_id: projectId,
            name: def.name,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'PLANNED',
          },
        });

        createdMilestones.push(milestone);

        // Next milestone starts after current ends
        currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Log activity
      await tx.project_activities.create({
        data: {
          id: randomUUID(),
          project_id: projectId,
          activity_type: 'NOTE_ADDED',
          description: `Applied milestone template: ${template.template_name}`,
          performed_by: userId,
          metadata: {
            template_id: templateId,
            milestones_count: createdMilestones.length,
          },
        },
      });

      return createdMilestones;
    });

    return result;
  }

  /**
   * Get project milestones with tasks
   */
  async getMilestones(projectId: string) {
    const milestones = await prisma.project_milestones.findMany({
      where: { project_id: projectId },
      include: {
        project_tasks: {
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { start_date: 'asc' },
    });

    // Get all unique assignee IDs from all tasks
    const assigneeIds = [...new Set(
      milestones.flatMap(m => 
        m.project_tasks
          .map(t => t.assignee_id)
          .filter(Boolean)
      )
    )] as string[];

    // Fetch all assignees in one query
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
    const enrichedMilestones = milestones.map(milestone => ({
      ...milestone,
      project_tasks: milestone.project_tasks.map(task => ({
        ...task,
        assignee: task.assignee_id ? assigneeMap.get(task.assignee_id) || null : null,
      })),
    }));

    return enrichedMilestones;
  }

  /**
   * Create manual milestone
   */
  async createMilestone(
    projectId: string,
    data: CreateMilestoneData,
    userId: string
  ) {
    // Check if user is PM
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      const error: any = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    if (project.pm_user_id !== userId) {
      const error: any = new Error(
        'Forbidden: Only the assigned PM can create milestones'
      );
      error.statusCode = 403;
      throw error;
    }

    const milestone = await prisma.project_milestones.create({
      data: {
        project_id: projectId,
        name: data.name,
        start_date: this.normalizeDate(data.startDate) || new Date().toISOString(),
        end_date: this.normalizeDate(data.endDate) || new Date().toISOString(),
        status: data.status || 'PLANNED',
      },
    });

    return milestone;
  }

  /**
   * Update milestone
   */
  async updateMilestone(
    milestoneId: string,
    data: Partial<CreateMilestoneData>,
    userId: string
  ) {
    const milestone = await prisma.project_milestones.findUnique({
      where: { id: milestoneId },
      include: { projects: true },
    });

    if (!milestone) {
      const error: any = new Error('Milestone not found');
      error.statusCode = 404;
      throw error;
    }

    if (milestone.projects.pm_user_id !== userId) {
      const error: any = new Error(
        'Forbidden: Only the assigned PM can update milestones'
      );
      error.statusCode = 403;
      throw error;
    }

    const updated = await prisma.project_milestones.update({
      where: { id: milestoneId },
      data: {
        name: data.name,
        start_date: this.normalizeDate(data.startDate),
        end_date: this.normalizeDate(data.endDate),
        status: data.status,
      },
    });

    return updated;
  }

  /**
   * Delete milestone
   */
  async deleteMilestone(milestoneId: string, userId: string) {
    const milestone = await prisma.project_milestones.findUnique({
      where: { id: milestoneId },
      include: { projects: true },
    });

    if (!milestone) {
      const error: any = new Error('Milestone not found');
      error.statusCode = 404;
      throw error;
    }

    if (milestone.projects.pm_user_id !== userId) {
      const error: any = new Error(
        'Forbidden: Only the assigned PM can delete milestones'
      );
      error.statusCode = 403;
      throw error;
    }

    // Delete milestone and cascade delete tasks
    await prisma.project_milestones.delete({
      where: { id: milestoneId },
    });

    // Log activity
    await prisma.project_activities.create({
      data: {
        id: randomUUID(),
        project_id: milestone.project_id,
        activity_type: 'NOTE_ADDED',
        description: `Deleted milestone: ${milestone.name}`,
        performed_by: userId,
      },
    });

    return { success: true };
  }

  /**
   * Get milestone templates
   */
  async getTemplates(projectType?: string) {
    const where: any = {};

    if (projectType) {
      where.project_type = projectType;
    }

    const templates = await prisma.milestone_templates.findMany({
      where,
      orderBy: { template_name: 'asc' },
    });

    return templates;
  }
}

export const milestoneService = new MilestoneService();
