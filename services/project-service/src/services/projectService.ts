import prisma from '../utils/prisma';
import { NotificationService } from '../utils/notifications';

interface AssignPmData {
  pmUserId: string;
}

interface BomItem {
  itemId: string;
  itemType: 'MATERIAL' | 'SERVICE';
  quantity: number;
}

interface CreateBomData {
  items: BomItem[];
}

export class ProjectService {
  /**
   * Get project by ID with all relations
   */
  async getProjectById(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        customer: true,
        pm_user: {
          include: {
            employee: true,
          },
        },
        sales_user: {
          include: {
            employee: true,
          },
        },
        sales_orders: true,
        estimations: {
          include: {
            items: true,
          },
        },
        project_boms: true,
        project_milestones: true,
        activities: {
          orderBy: {
            performed_at: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!project) {
      return null;
    }

    // Enrich estimation items with Material/Service names
    if (project.estimations && project.estimations.length > 0) {
      for (const estimation of project.estimations) {
        for (const item of estimation.items) {
          if (item.item_type === 'MATERIAL') {
            const material = await prisma.material.findUnique({
              where: { id: item.item_id },
              select: { item_name: true },
            });
            (item as any).item_name = material?.item_name || 'Unknown Material';
          } else if (item.item_type === 'SERVICE') {
            const service = await prisma.service.findUnique({
              where: { id: item.item_id },
              select: { service_name: true },
            });
            (item as any).item_name = service?.service_name || 'Unknown Service';
          }
        }
      }
    }

    // Enrich project_boms with Material/Service names
    if (project.project_boms && project.project_boms.length > 0) {
      for (const bomItem of project.project_boms) {
        if (bomItem.item_type === 'MATERIAL') {
          const material = await prisma.material.findUnique({
            where: { id: bomItem.item_id },
            select: { item_name: true },
          });
          (bomItem as any).item_name = material?.item_name || 'Unknown Material';
        } else if (bomItem.item_type === 'SERVICE') {
          const service = await prisma.service.findUnique({
            where: { id: bomItem.item_id },
            select: { service_name: true },
          });
          (bomItem as any).item_name = service?.service_name || 'Unknown Service';
        }
      }
    }

    return project;
  }

  /**
   * Assign PM to project
   */
  async assignPmToProject(
    projectId: string,
    data: AssignPmData,
    loggedInUserId: string
  ) {
    // Check if user has permission (must be Operational Manager or CEO)
    const loggedInUser = await prisma.users.findUnique({
      where: { id: loggedInUserId },
    });

    if (!loggedInUser) {
      throw new Error('User not found');
    }

    const hasPermission =
      loggedInUser.roles.includes('OPERATIONAL_MANAGER') ||
      loggedInUser.roles.includes('CEO');

    if (!hasPermission) {
      throw new Error('Forbidden: Only Operational Manager or CEO can assign PM');
    }

    // Verify PM user exists and has PM role
    const pmUser = await prisma.users.findUnique({
      where: { id: data.pmUserId },
      include: { employee: true },
    });

    if (!pmUser) {
      throw new Error('PM user not found');
    }

    if (!pmUser.roles.includes('PROJECT_MANAGER')) {
      throw new Error('Selected user is not a Project Manager');
    }

    // Fetch current project to capture previous status
    const existingProjectForStatus = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    });
    const previousStatus = existingProjectForStatus?.status || 'New';
    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        pm_user_id: data.pmUserId,
        status: 'Planning', // Transition to Planning only on PM assignment
        updated_at: new Date(),
        updated_by: loggedInUserId,
      },
      include: {
        customer: true,
        pm_user: { include: { employee: true } },
      },
    });

    // Create activity log
    await prisma.projectActivity.create({
      data: {
        project_id: projectId,
        activity_type: 'STATUS_CHANGE',
        description: `Project Manager assigned: ${pmUser.employee?.full_name || pmUser.email}`,
        performed_by: loggedInUserId,
        metadata: {
          old_status: previousStatus,
          new_status: 'Planning',
          pm_user_id: data.pmUserId,
        },
      },
    });

    // Send notification to PM
    await NotificationService.send({
      userId: data.pmUserId,
      message: `Anda telah ditugaskan sebagai PM untuk proyek '${updatedProject.project_name}'`,
      link: `/projects/${projectId}`,
      type: 'info',
    });

    return updatedProject;
  }

  /**
   * Create or update BoM for project
   */
  async createOrUpdateBom(
    projectId: string,
    data: CreateBomData,
    loggedInUserId: string
  ) {
    // Check project exists and user is the PM
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.pm_user_id !== loggedInUserId) {
      throw new Error('Forbidden: Only the assigned PM can modify BoM');
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing BoM items
      await tx.projectBOM.deleteMany({
        where: { project_id: projectId },
      });

      // Create new BoM items
      const bomItems = await Promise.all(
        data.items.map((item) =>
          tx.projectBOM.create({
            data: {
              project_id: projectId,
              item_id: item.itemId,
              item_type: item.itemType,
              quantity: item.quantity,
            },
          })
        )
      );

      // Create activity log
      await tx.projectActivity.create({
        data: {
          project_id: projectId,
          activity_type: 'NOTE_ADDED',
          description: `BoM updated with ${data.items.length} items`,
          performed_by: loggedInUserId,
          metadata: {
            item_count: data.items.length,
            action: 'BOM_UPDATE',
          },
        },
      });

      return bomItems;
    });

    return result;
  }

  /**
   * Get all projects with filters
   */
  async getProjects(filters?: {
    status?: string;
    pmUserId?: string;
    salesUserId?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.pmUserId) {
      where.pm_user_id = filters.pmUserId;
    }

    if (filters?.salesUserId) {
      where.sales_user_id = filters.salesUserId;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        customer: true,
        pm_user: {
          include: {
            employee: true,
          },
        },
        sales_user: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return projects;
  }

  /**
   * Get users with PM role
   */
  async getProjectManagers() {
    const pms = await prisma.users.findMany({
      where: {
        roles: {
          has: 'PROJECT_MANAGER',
        },
        is_active: true,
      },
      include: {
        employee: true,
      },
      orderBy: {
        email: 'asc',
      },
    });

    return pms;
  }
}
