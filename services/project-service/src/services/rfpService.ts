import prisma from '../utils/prisma';
import { randomUUID } from 'crypto';

interface CreateRfpData {
  items: Array<{
    itemId: string;
    itemType: 'MATERIAL' | 'SERVICE';
    quantity: number;
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
    try {
      console.log('[RFP] Creating RFP for project:', projectId);
      console.log('[RFP] User:', loggedInUserId);
      console.log('[RFP] Data:', JSON.stringify(data, null, 2));

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

      console.log('[RFP] Project found:', project.project_name);
      console.log('[RFP] PM user ID:', project.pm_user_id);

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

      // Create RFP items - Fetch item details from database
      const rfpItemsData = [];
      
      for (const item of data.items) {
        console.log('[RFP] Processing item:', item);
        let itemName = '';
        let unit = '';

        if (item.itemType === 'MATERIAL') {
          console.log('[RFP] Looking up material:', item.itemId);
          const material = await tx.material.findUnique({
            where: { id: item.itemId },
            select: { item_name: true, satuan: true },
          });
          if (!material) {
            console.error('[RFP] Material not found:', item.itemId);
            throw new Error(`Material with ID ${item.itemId} not found`);
          }
          console.log('[RFP] Material found:', material);
          itemName = material.item_name;
          unit = material.satuan || '';
        } else if (item.itemType === 'SERVICE') {
          console.log('[RFP] Looking up service:', item.itemId);
          const service = await tx.service.findUnique({
            where: { id: item.itemId },
            select: { service_name: true, unit: true },
          });
          if (!service) {
            console.error('[RFP] Service not found:', item.itemId);
            throw new Error(`Service with ID ${item.itemId} not found`);
          }
          console.log('[RFP] Service found:', service);
          itemName = service.service_name;
          unit = service.unit || '';
        } else {
          throw new Error(`Invalid item type: ${item.itemType}`);
        }

        rfpItemsData.push({
          id: randomUUID(),
          rfp_id: newRfp.id,
          item_name: itemName,
          item_type: item.itemType,
          material_id: item.itemType === 'MATERIAL' ? item.itemId : null,
          service_id: item.itemType === 'SERVICE' ? item.itemId : null,
          quantity: item.quantity,
          unit: unit || null,
          notes: item.notes || null,
          created_at: new Date(),
        });
      }

      await tx.rfp_items.createMany({
        data: rfpItemsData,
      });

      // Update BoM items status to RFP_SUBMITTED
      console.log('[RFP] Updating BoM items status to RFP_SUBMITTED');
      for (const item of data.items) {
        await tx.project_boms.updateMany({
          where: {
            project_id: projectId,
            item_id: item.itemId,
            item_type: item.itemType as any,
          },
          data: {
            procurement_status: 'RFP_SUBMITTED',
          },
        });
      }

      // Fetch complete RFP with items
      const completeRfp = await tx.request_for_purchases.findUnique({
        where: { id: newRfp.id },
        include: {
          rfp_items: true,
        },
      });

        return completeRfp;
      });

      console.log('[RFP] Transaction completed. RFP created:', rfp?.rfp_number);


      return rfp;
    } catch (error) {
      console.error('[RFP] Error creating RFP:', error);
      throw error;
    }
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
                category: true,
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
                category: true,
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
