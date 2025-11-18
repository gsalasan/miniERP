import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface PipelineData {
  [status: string]: {
    items: any[];
    totalValue: number;
  };
}

export interface UserInfo {
  id: string;
  role?: string;  // Single role (legacy)
  roles?: string[]; // Multiple roles (new format)
  name?: string;
  email?: string;
}

export interface ProjectWithCustomer {
  id: string;
  project_name: string;
  description: string | null;
  customer: {
    id: string;
    name: string;
    city: string;
  };
  estimated_value: number | null;
  contract_value: number | null;
  lead_score: number | null;
  estimation_status: string | null;
  priority: string;
  expected_close_date: Date | null;
  sales_user_id: string;
  created_at: Date;
  updated_at: Date;
}

export class PipelineService {
  /**
   * Generate a unique project number with format PRJ-YYYYMM-XXXX
   * Fallback retries if collision occurs
   */
  private async generateUniqueProjectNumber(maxRetries = 5): Promise<string> {
    let attempt = 0;
    while (attempt < maxRetries) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const candidate = `PRJ-${y}${m}-${rand}`;

      const exists = await prisma.projects.findUnique({
        where: { project_number: candidate }
      });
      if (!exists) return candidate;
      attempt++;
    }
    // Last resort include timestamp for extra entropy
    const ts = Date.now();
    return `PRJ-${ts}`;
  }
  
  /**
   * Get pipeline data grouped by status with role-based filtering
   */
  async getPipelineData(user: UserInfo): Promise<{ pipeline: PipelineData; summary: any }> {
    // Define query filter based on user role
    let queryFilter: any = {
      status: {
        in: ['PROSPECT', 'MEETING_SCHEDULED', 'PRE_SALES', 'PROPOSAL_DELIVERED', 'NEGOTIATION']
      }
    };

    // Role-based filtering
    // Support both single role (legacy) and roles array (new format)
    const userRoles = user.roles || (user.role ? [user.role] : []);
    const hasValidRole = userRoles.some(role => ['SALES', 'CEO', 'SALES_MANAGER'].includes(role));
    
    if (!hasValidRole) {
      throw new Error('Insufficient permissions');
    }
    
    if (userRoles.includes('SALES') && !userRoles.includes('CEO') && !userRoles.includes('SALES_MANAGER')) {
      queryFilter.sales_user_id = user.id;
    }

    // Fetch projects with customer data
    const projects = await prisma.projects.findMany({
      where: queryFilter,
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
            city: true,
            status: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    // Initialize pipeline structure
    const pipeline: PipelineData = {
      'PROSPECT': { items: [], totalValue: 0 },
      'MEETING_SCHEDULED': { items: [], totalValue: 0 },
      'PRE_SALES': { items: [], totalValue: 0 },
      'PROPOSAL_DELIVERED': { items: [], totalValue: 0 },
      'NEGOTIATION': { items: [], totalValue: 0 }
    };

    // Group projects by status and calculate totals
    projects.forEach(project => {
      const status = project.status;
      if (pipeline[status]) {
        pipeline[status].items.push({
          id: project.id,
          project_name: project.project_name,
          description: project.description,
          customer: {
            id: project.customer.id,
            name: project.customer.customer_name,
            city: project.customer.city
          },
          estimated_value: project.estimated_value,
          contract_value: project.contract_value,
          lead_score: project.lead_score,
          estimation_status: project.estimation_status,
          priority: project.priority,
          expected_close_date: project.expected_close_date,
          sales_user_id: project.sales_user_id,
          created_at: project.created_at,
          updated_at: project.updated_at
        });
        
        // Add to total value (use contract_value if available, otherwise estimated_value)
        const value = project.contract_value || project.estimated_value || 0;
        pipeline[status].totalValue += Number(value);
      }
    });

    // Calculate summary
    const totalOpportunities = projects.length;
    const totalValue = Object.values(pipeline).reduce((sum, column) => sum + column.totalValue, 0);

    return {
      pipeline,
      summary: {
        totalOpportunities,
        totalValue,
        currency: 'IDR'
      }
    };
  }

  /**
   * Move a project card to a new status with business rules validation
   */
  async moveProjectCard(projectId: string, newStatus: string, user: UserInfo): Promise<any> {
    // Validate status
    const validStatuses = ['PROSPECT', 'MEETING_SCHEDULED', 'PRE_SALES', 'PROPOSAL_DELIVERED', 'NEGOTIATION', 'WON', 'LOST', 'ON_HOLD'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status provided');
    }

    // Find the project
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Authorization check
    const userRoles = user.roles || (user.role ? [user.role] : []);
    if (userRoles.includes('SALES') && !userRoles.includes('CEO') && !userRoles.includes('SALES_MANAGER') && project.sales_user_id !== user.id) {
      throw new Error('You can only move your own projects');
    }

    // Business rules validation
    this.validateStatusTransition(project, newStatus);

    const oldStatus = project.status;

    // Update project status
    const updatedProject = await prisma.projects.update({
      where: { id: projectId },
      data: { 
        status: newStatus,
        updated_by: user.id
      },
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
            city: true
          }
        }
      }
    });

    // Create activity log
    await this.createActivityLog(projectId, oldStatus, newStatus, user);

    return {
      id: updatedProject.id,
      project_name: updatedProject.project_name,
      description: updatedProject.description,
      customer: updatedProject.customer,
      status: updatedProject.status,
      estimated_value: updatedProject.estimated_value,
      contract_value: updatedProject.contract_value,
      lead_score: updatedProject.lead_score,
      estimation_status: updatedProject.estimation_status,
      priority: updatedProject.priority,
      expected_close_date: updatedProject.expected_close_date,
      updated_at: updatedProject.updated_at
    };
  }

  /**
   * Get project by ID
   */
  private async getProjectById(projectId: string): Promise<any> {
    return await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        customer: {
          select: {
            customer_name: true
          }
        }
      }
    });
  }

  /**
   * Validate business rules for status transitions
   */
  private validateStatusTransition(project: any, newStatus: string): void {
    // Business rule: Cannot move to PROPOSAL_DELIVERED without approved estimation
    if (project.status === 'PRE_SALES' && 
        newStatus === 'PROPOSAL_DELIVERED' && 
        project.estimation_status !== 'APPROVED') {
      throw new Error('Tidak bisa membuat proposal sebelum estimasi disetujui');
    }

    // Add more business rules here as needed
    // Example: Cannot move from PROSPECT directly to NEGOTIATION
    if (project.status === 'PROSPECT' && newStatus === 'NEGOTIATION') {
      throw new Error('Tidak bisa langsung ke tahap negosiasi dari prospek');
    }

    // Example: Cannot reopen LOST or WON projects to active statuses
    const activeStatuses = ['PROSPECT', 'MEETING_SCHEDULED', 'PRE_SALES', 'PROPOSAL_DELIVERED', 'NEGOTIATION'];
    if (['LOST', 'WON'].includes(project.status) && activeStatuses.includes(newStatus)) {
      throw new Error('Tidak bisa mengaktifkan kembali project yang sudah selesai');
    }
  }

  /**
   * Create activity log for status changes
   */
  private async createActivityLog(projectId: string, oldStatus: string, newStatus: string, user: UserInfo): Promise<void> {
    await prisma.project_activities.create({
      data: {
        project_id: projectId,
        activity_type: 'STATUS_CHANGE',
        description: `Status diubah dari '${oldStatus}' menjadi '${newStatus}' oleh ${user.name}`,
        performed_by: user.id,
        metadata: {
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: user.name,
          changed_by_id: user.id
        }
      }
    });
  }

  /**
   * Get project activities for audit trail
   */
  async getProjectActivities(projectId: string, user: UserInfo): Promise<any[]> {
    // Check if user has permission to view this project
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const userRoles = user.roles || (user.role ? [user.role] : []);
    if (userRoles.includes('SALES') && !userRoles.includes('CEO') && !userRoles.includes('SALES_MANAGER') && project.sales_user_id !== user.id) {
      throw new Error('You can only view activities of your own projects');
    }

    return await prisma.project_activities.findMany({
      where: { project_id: projectId },
      orderBy: { performed_at: 'desc' },
      take: 50 // Limit to recent 50 activities
    });
  }

  /**
   * Create a new project
   */
  async createProject(projectData: any, user: UserInfo): Promise<any> {
    // Ensure unique project_number. If client doesn't send, generate one.
    const clientProvidedNumber = projectData.project_number as string | undefined;
    let projectNumber = clientProvidedNumber || (await this.generateUniqueProjectNumber());

    const dataToCreate = {
      ...projectData,
      project_number: projectNumber,
      status: projectData.status || 'PROSPECT',
      contract_value: projectData.contract_value || projectData.estimated_value || 0,
      sales_user_id: projectData.sales_user_id || user.id,
      created_by: user.id,
      updated_by: user.id
    };

    // Try create, handle unique conflict on project_number
    try {
      return await prisma.projects.create({
        data: dataToCreate,
        include: {
          customer: {
            select: { id: true, customer_name: true, city: true }
          }
        }
      });
    } catch (err: any) {
      // If duplicate on project_number
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta as any)?.target as string[] | undefined;
        const violatedProjectNumber = !target || target.includes('project_number');
        if (violatedProjectNumber) {
          if (clientProvidedNumber) {
            // Client sent a duplicate number -> signal a controlled error
            const e = new Error('DUPLICATE_PROJECT_NUMBER');
            (e as any).details = { field: 'project_number' };
            throw e;
          }
          // We generated it; retry a few times automatically
          for (let i = 0; i < 3; i++) {
            projectNumber = await this.generateUniqueProjectNumber();
            try {
              return await prisma.projects.create({
                data: { ...dataToCreate, project_number: projectNumber },
                include: {
                  customer: { select: { id: true, customer_name: true, city: true } }
                }
              });
            } catch (retryErr: any) {
              if (!(retryErr instanceof Prisma.PrismaClientKnownRequestError && retryErr.code === 'P2002')) {
                throw retryErr;
              }
            }
          }
          const e = new Error('FAILED_TO_GENERATE_UNIQUE_PROJECT_NUMBER');
          throw e;
        }
      }
      throw err;
    }
  }

  /**
   * Update project details
   */
  async updateProject(projectId: string, updateData: any, user: UserInfo): Promise<any> {
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Authorization check
    const userRoles = user.roles || (user.role ? [user.role] : []);
    if (userRoles.includes('SALES') && !userRoles.includes('CEO') && !userRoles.includes('SALES_MANAGER') && project.sales_user_id !== user.id) {
      throw new Error('You can only update your own projects');
    }

    return await prisma.projects.update({
      where: { id: projectId },
      data: {
        ...updateData,
        updated_by: user.id
      },
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
            city: true
          }
        }
      }
    });
  }
}

export const pipelineService = new PipelineService();