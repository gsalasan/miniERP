import prisma from '../utils/prisma';
import { NotificationService } from '../utils/notifications';

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
   * Apply milestone template to project
   */
  async applyTemplate(
    projectId: string,
    templateId: string,
    userId: string
  ) {
    // Check if user is PM of the project
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
        'Forbidden: Only the assigned PM can apply templates'
      );
      error.statusCode = 403;
      throw error;
    }

    // Get template
    const template = await prisma.milestoneTemplate.findUnique({
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

        const milestone = await tx.projectMilestone.create({
          data: {
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
      await tx.projectActivity.create({
        data: {
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
    const milestones = await prisma.projectMilestone.findMany({
      where: { project_id: projectId },
      include: {
        tasks: {
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
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { start_date: 'asc' },
    });

    return milestones;
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
        'Forbidden: Only the assigned PM can create milestones'
      );
      error.statusCode = 403;
      throw error;
    }

    const milestone = await prisma.projectMilestone.create({
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
    const milestone = await prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });

    if (!milestone) {
      const error: any = new Error('Milestone not found');
      error.statusCode = 404;
      throw error;
    }

    if (milestone.project.pm_user_id !== userId) {
      const error: any = new Error(
        'Forbidden: Only the assigned PM can update milestones'
      );
      error.statusCode = 403;
      throw error;
    }

    const updated = await prisma.projectMilestone.update({
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
    const milestone = await prisma.projectMilestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });

    if (!milestone) {
      const error: any = new Error('Milestone not found');
      error.statusCode = 404;
      throw error;
    }

    if (milestone.project.pm_user_id !== userId) {
      const error: any = new Error(
        'Forbidden: Only the assigned PM can delete milestones'
      );
      error.statusCode = 403;
      throw error;
    }

    // Delete milestone and cascade delete tasks
    await prisma.projectMilestone.delete({
      where: { id: milestoneId },
    });

    // Log activity
    await prisma.projectActivity.create({
      data: {
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

    const templates = await prisma.milestoneTemplate.findMany({
      where,
      orderBy: { template_name: 'asc' },
    });

    return templates;
  }
}

export const milestoneService = new MilestoneService();
