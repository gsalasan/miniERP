import prisma from '../utils/prisma';
import { randomUUID } from 'crypto';

interface CreateRfpData {
  items: Array<{
    itemId: string;
    itemType: 'MATERIAL' | 'SERVICE';
    itemName: string;
    quantity: number;
    unit?: string;
    notes?: string;
  }>;
  notes?: string;
}

export class RfpService {
  /**
   * Generate RFP number with format: RFP-YYYYMMDD-XXX
   */
  private async generateRfpNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const countToday = await prisma.request_for_purchases.count({
      where: {
        created_at: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });
    
    return `RFP-${dateStr}-${String(countToday + 1).padStart(3, '0')}`;
  }

  /**
   * Create RFP (Request for Purchase)
   */
  async createRfp(
    projectId: string,
    data: CreateRfpData,
    loggedInUserId: string
  ) {
    // Fetch project details
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        project_name: true,
        pm_user_id: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Authorization: Only PM can create RFP
    if (project.pm_user_id !== loggedInUserId) {
      throw new Error('Forbidden: Only the assigned PM can create RFP');
    }

    // Fetch user details
    const user = await prisma.users.findUnique({
      where: { id: loggedInUserId },
      include: {
        employees: {
          select: {
            full_name: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const requesterName = user.employees?.full_name || user.email;

    // Validate input
    if (!data.items || data.items.length === 0) {
      throw new Error('RFP must contain at least one item');
    }

    // Generate RFP number
    const rfpNumber = await this.generateRfpNumber();

    // Create RFP within transaction
    const rfp = await prisma.$transaction(async (tx) => {
      // Create RFP header
      const newRfp = await tx.request_for_purchases.create({
        data: {
          id: randomUUID(),
          rfp_number: rfpNumber,
          project_id: projectId,
          project_name: project.project_name,
          requester_id: loggedInUserId,
          requester_name: requesterName,
          status: 'PENDING',
          notes: data.notes || null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Create RFP items
      const rfpItemsData = data.items.map((item) => ({
        id: randomUUID(),
        rfp_id: newRfp.id,
        item_name: item.itemName,
        item_type: item.itemType,
        material_id: item.itemType === 'MATERIAL' ? item.itemId : null,
        service_id: item.itemType === 'SERVICE' ? item.itemId : null,
        quantity: item.quantity,
        unit: item.unit || null,
        notes: item.notes || null,
        created_at: new Date(),
      }));

      await tx.rfp_items.createMany({
        data: rfpItemsData,
      });

      // Fetch complete RFP with items
      const completeRfp = await tx.request_for_purchases.findUnique({
        where: { id: newRfp.id },
        include: {
          rfp_items: true,
        },
      });

      return completeRfp;
    });

    // TODO: Send notification to Admin Project role
    // NotificationService.send({
    //   role: 'ADMIN_PROJECT',
    //   message: `RFP baru (${rfpNumber}) untuk proyek ${project.project_name} telah dibuat dan menunggu diproses.`,
    //   link: `/procurement/rfp/${rfp!.id}`,
    // });

    return rfp;
  }

  /**
   * Get RFPs for a project
   */
  async getRfpsByProject(projectId: string) {
    const rfps = await prisma.request_for_purchases.findMany({
      where: { project_id: projectId },
      include: {
        rfp_items: {
          include: {
            Material: {
              select: {
                id: true,
                item_name: true,
                brand: true,
              },
            },
            Service: {
              select: {
                id: true,
                service_name: true,
                service_category: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return rfps;
  }

  /**
   * Get RFP by ID
   */
  async getRfpById(rfpId: string) {
    const rfp = await prisma.request_for_purchases.findUnique({
      where: { id: rfpId },
      include: {
        rfp_items: {
          include: {
            Material: {
              select: {
                id: true,
                item_name: true,
                brand: true,
                vendor: true,
              },
            },
            Service: {
              select: {
                id: true,
                service_name: true,
                service_category: true,
              },
            },
          },
        },
        projects: {
          select: {
            id: true,
            project_name: true,
            project_number: true,
          },
        },
        users_request_for_purchases_requester_idTousers: {
          select: {
            id: true,
            email: true,
            employees: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
    });

    return rfp;
  }

  /**
   * Update RFP status
   */
  async updateRfpStatus(
    rfpId: string,
    status: string,
    processedByUserId?: string
  ) {
    const updateData: any = {
      status,
      updated_at: new Date(),
    };

    if (processedByUserId) {
      updateData.processed_by = processedByUserId;
      updateData.processed_at = new Date();
    }

    const rfp = await prisma.request_for_purchases.update({
      where: { id: rfpId },
      data: updateData,
    });

    return rfp;
  }
}
