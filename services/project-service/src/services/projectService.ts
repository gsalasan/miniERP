import prisma from '../utils/prisma';
import { NotificationService } from '../utils/notifications';
import { randomUUID } from 'crypto';

interface AssignPmData {
  pmUserId: string | null;
}

interface BomItem {
  itemId: string;
  itemType: 'MATERIAL' | 'SERVICE';
  quantity: number;
}

interface CreateBomData {
  items: BomItem[];
}

interface CreateRfpData {
  items: Array<{
    itemId: string;
    itemType: 'MATERIAL' | 'SERVICE';
    quantity: number;
    unit?: string;
    notes?: string;
  }>;
  notes?: string;
}

export class ProjectService {
  /**
   * Get project by ID with all relations
   */
  async getProjectById(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
            channel: true,
            city: true,
            status: true,
            top_days: true,
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

    // Fetch PM user separately if exists (no relation in schema)
    const pmUser = project.pm_user_id ? await prisma.users.findUnique({
      where: { id: project.pm_user_id },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
          },
        },
      },
    }) : null;

    // Fetch sales user separately if exists
    const salesUser = project.sales_user_id ? await prisma.users.findUnique({
      where: { id: project.sales_user_id },
      include: {
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
          },
        },
      },
    }) : null;

    // Normalize response: customers -> customer (singular), add user objects
    const normalizedProject = {
      ...project,
      customer: (project as any).customer || null,
      pm_user: pmUser,
      sales_user: salesUser,
      estimations: project.estimations?.map((est) => ({ ...est, items: (est as any).items || [] })),
    };

    // Enrich estimation items with Material/Service names
    if (normalizedProject.estimations && normalizedProject.estimations.length > 0) {
      for (const estimation of normalizedProject.estimations) {
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

    return normalizedProject;
  }

  /**
   * Create Request For Purchase (RFP) for selected BOM items.
   * Ensures caller is the project's assigned PM.
   */
  async createRfp(projectId: string, data: CreateRfpData, loggedInUserId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    if (project.pm_user_id !== loggedInUserId) {
      throw new Error('Forbidden: Only the assigned PM can create RFP');
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('items array is required');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Generate RFP number
      const rfpNumber = await this.generateRfpNumber(tx);

      // Create RFP header
      const rfp = await tx.request_for_purchases.create({
        data: {
          rfp_number: rfpNumber,
          project_id: projectId,
          project_name: project.project_name,
          requester_id: loggedInUserId,
          requester_name: (await tx.users.findUnique({ where: { id: loggedInUserId } }))?.email || 'unknown',
          notes: data.notes || null,
        },
      });

      // Create items and update BOM statuses
      const createdItems = [] as any[];
      for (const it of data.items) {
        let itemName = it.itemId;
        if (it.itemType === 'MATERIAL') {
          const material = await tx.material.findUnique({ where: { id: it.itemId }, select: { item_name: true } });
          itemName = material?.item_name || it.itemId;
        } else if (it.itemType === 'SERVICE') {
          const service = await tx.service.findUnique({ where: { id: it.itemId }, select: { service_name: true } });
          itemName = service?.service_name || it.itemId;
        }

        const created = await tx.rfp_items.create({
          data: {
            rfp_id: rfp.id,
            item_name: itemName,
            item_type: it.itemType === 'MATERIAL' ? 'MATERIAL' : 'SERVICE',
            material_id: it.itemType === 'MATERIAL' ? it.itemId : null,
            service_id: it.itemType === 'SERVICE' ? it.itemId : null,
            quantity: it.quantity,
            unit: it.unit || '',
            notes: it.notes || null,
          },
        });
        createdItems.push(created);

        // Try to update corresponding ProjectBOM if exists
        const bom = await tx.project_boms.findFirst({ where: { project_id: projectId, item_id: it.itemId } });
        if (bom) {
          const need = (Number(it.quantity) - Number(bom.available_stock || 0));
          await tx.project_boms.update({
            where: { id: bom.id },
            data: {
              procurement_need: need > 0 ? need : 0,
              procurement_status: 'RFP_SUBMITTED',
            },
          });
        }
      }

      // Log activity
      await tx.project_activities.create({
        data: {
          id: randomUUID(),
          project_id: projectId,
          activity_type: 'NOTE_ADDED',
          description: `RFP ${rfpNumber} created with ${data.items.length} items`,
          performed_by: loggedInUserId,
          metadata: { rfpId: rfp.id, itemCount: data.items.length },
        },
      });

      // Notify procurement/admin users
      const recipients = await tx.users.findMany({ where: { roles: { has: 'PROCUREMENT_ADMIN' }, is_active: true }, select: { id: true } });
      const recipientIds = recipients.map((r) => r.id);
      if (recipientIds.length > 0) {
        await NotificationService.sendToMultiple(recipientIds, `New RFP ${rfpNumber} created for project ${project.project_name}.`, `/projects/${projectId}`);
      }

      // return full RFP with items
      const full = await tx.request_for_purchases.findUnique({
        where: { id: rfp.id },
        include: { items: true },
      });

      return full;
    });

    return result;
  }

  private async generateRfpNumber(tx: any) {
    // Simple generator: RFP-{YYYY}{MM}{DD}-{timestampSuffix}
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const suffix = String(Date.now()).slice(-6);
    return `RFP-${y}${m}${d}-${suffix}`;
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

    let pmUser = null;
    // Verify PM user exists and has PM role (only if assigning, not unassigning)
    if (data.pmUserId) {
      pmUser = await prisma.users.findUnique({
        where: { id: data.pmUserId },
        include: { employees: true },
      });

      if (!pmUser) {
        throw new Error('PM user not found');
      }

      if (!pmUser.roles.includes('PROJECT_MANAGER')) {
        throw new Error('Selected user is not a Project Manager');
      }
    }

    // Fetch current project to capture previous status
    const existingProjectForStatus = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    });
    const previousStatus = existingProjectForStatus?.status || 'New';
    
    // Determine new status based on PM assignment
    const newStatus = data.pmUserId ? 'Planning' : 'WON'; // Revert to WON if unassigning
    
    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        pm_user_id: data.pmUserId,
        status: newStatus,
        updated_at: new Date(),
        updated_by: loggedInUserId,
      },
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
            channel: true,
            city: true,
            status: true,
          },
        },
      },
    });

    // Fetch PM user separately (no relation in schema)
    const pmUserForResponse = data.pmUserId ? await prisma.users.findUnique({
      where: { id: data.pmUserId },
      include: {
        employees: {
          select: {
            id: true,
            full_name: true,
            position: true,
            email: true,
          },
        },
      },
    }) : null;

    // Fetch sales user separately if exists
    const salesUserForResponse = updatedProject.sales_user_id ? await prisma.users.findUnique({
      where: { id: updatedProject.sales_user_id },
      include: {
        employees: {
          select: {
            id: true,
            full_name: true,
            position: true,
            email: true,
          },
        },
      },
    }) : null;

    // Create activity log
    await prisma.project_activities.create({
      data: {
        id: randomUUID(),
        project_id: projectId,
        activity_type: 'STATUS_CHANGE',
        description: data.pmUserId 
          ? `Project Manager assigned: ${pmUser?.employees?.full_name || pmUser?.email}`
          : 'Project Manager unassigned',
        performed_by: loggedInUserId,
        metadata: {
          old_status: previousStatus,
          new_status: newStatus,
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

    // Normalize response: customers -> customer (singular), add user objects
    const normalizedProject = {
      ...updatedProject,
      customer: updatedProject.customers,
      pm_user: pmUserForResponse,
      sales_user: salesUserForResponse,
    };
    delete (normalizedProject as any).customers;

    return normalizedProject;
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
    const project = await prisma.projects.findUnique({
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
      await tx.project_boms.deleteMany({
        where: { project_id: projectId },
      });

      // Create new BoM items
      const bomItems = await Promise.all(
        data.items.map((item) =>
          tx.project_boms.create({
            data: {
              id: randomUUID(),
              project_id: projectId,
              item_id: item.itemId,
              item_type: item.itemType,
              quantity: item.quantity,
            },
          })
        )
      );

      // Create activity log
      await tx.project_activities.create({
        data: {
          id: randomUUID(),
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
        customer: {
          select: {
            id: true,
            customer_name: true,
            channel: true,
            city: true,
            status: true,
            top_days: true,
          },
        },
        estimations: true,
        activities: true,
        project_milestones: true,
        sales_orders: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Fetch all unique user IDs for PM and sales
    const pmUserIds = [...new Set(projects.map(p => p.pm_user_id).filter(Boolean))] as string[];
    const salesUserIds = [...new Set(projects.map(p => p.sales_user_id).filter(Boolean))] as string[];
    const allUserIds = [...new Set([...pmUserIds, ...salesUserIds])];

    // Fetch all users in one query for efficiency
    const users = await prisma.users.findMany({
      where: {
        id: { in: allUserIds },
      },
      include: {
        // 'employee' is the relation name in the schema
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
          },
        },
      },
    });

    // Create enriched user map for quick lookup (flatten employee info)
    const userMap = new Map(
      users.map((u) => [
        u.id,
        {
          id: u.id,
          email: (u as any).email,
          full_name: (u as any).employee?.full_name || undefined,
          position: (u as any).employee?.position || undefined,
        },
      ])
    );

    // Normalize response: use 'customer' (singular) and attach enriched user objects
    const normalizedProjects = projects.map((project) => ({
      ...project,
      customer: (project as any).customer || null,
      pm_user: project.pm_user_id ? userMap.get(project.pm_user_id) || null : null,
      sales_user: project.sales_user_id ? userMap.get(project.sales_user_id) || null : null,
    }));

    return normalizedProjects;
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
        employees: true,
      },
      orderBy: {
        email: 'asc',
      },
    });

    return pms;
  }
}
