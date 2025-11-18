import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Default/suggested status values for new projects (can be customized by users)
const SUGGESTED_PROJECT_STATUSES: string[] = [
  'LEADS',
  'PROSPECT',
  'MEETING_SCHEDULED',
  'PRE_SALES',
  'PROPOSAL_DELIVERED',
  'WON',
  'LOST',
  'ON_HOLD',
  'DRAFT',
  'ONGOING',
  'COMPLETED',
  'CANCELLED'
];

/**
 * Basic validation: ensure status values are reasonable strings (no injection, reasonable length)
 */
function sanitizeStatuses(input: string[] | undefined, fallback: string[]): string[] {
  if (!input || input.length === 0) {
    return fallback;
  }
  
  // Filter: alphanumeric, underscore, dash, max 100 chars (matches DB VARCHAR(100))
  const valid: string[] = [];
  for (const s of input) {
    if (typeof s === 'string' && s.length > 0 && s.length <= 100 && /^[A-Z0-9_-]+$/i.test(s)) {
      valid.push(s.toUpperCase()); // Normalize to uppercase
    }
  }
  
  // If everything was invalid, return fallback
  if (valid.length === 0) {
    return fallback;
  }
  return valid;
}

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
  async getPipelineData(
    user: UserInfo,
    filterSalesUserId?: string,
    dynamicStatuses?: string[]
  ): Promise<{
    pipeline: PipelineData;
    summary: {
      totalOpportunities: number;
      totalValue: number;
      currency: string;
      requestedStatuses: string[];
      usedStatuses: string[];
      invalidRequestedStatuses: string[];
      availableStatusesForUser: { status: string; count: number }[];
    };
  }> {
    // Define query filter based on user role
    // Default pipeline stages (can be extended dynamically by users)
    const defaultStatuses = [
      'PROSPECT',
      'MEETING_SCHEDULED',
      'PRE_SALES',
      'PROPOSAL_DELIVERED',
    ];
    const selectedStatuses = sanitizeStatuses(
      Array.isArray(dynamicStatuses) ? dynamicStatuses : undefined,
      defaultStatuses
    );

    // Role-based filtering
    // Support both single role (legacy) and roles array (new format)
    const userRoles = user.roles || (user.role ? [user.role] : []);
    const hasValidRole = userRoles.some((role) =>
      ['SALES', 'CEO', 'SALES_MANAGER'].includes(role)
    );
    
    if (!hasValidRole) {
      throw new Error('Insufficient permissions');
    }
    
    let queryFilter: Record<string, unknown> = {};
    
    if (
      userRoles.includes('SALES') &&
      !userRoles.includes('CEO') &&
      !userRoles.includes('SALES_MANAGER')
    ) {
      // Sales hanya melihat proyek miliknya sendiri
      queryFilter.sales_user_id = user.id;
    } else if (filterSalesUserId && filterSalesUserId !== 'all') {
      // CEO / SALES_MANAGER bisa memfilter berdasarkan dropdown
      queryFilter.sales_user_id = filterSalesUserId;
    } else {
    }

    // Fetch projects with customer data
    const whereClause: Record<string, unknown> = {
      ...queryFilter,
      status: { in: selectedStatuses },
    };
    
    const projects = await prisma.projects.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
            city: true,
            status: true,
          },
        },
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    // Independent query to discover all statuses visible to this user (ignoring the status filter) for diagnostics
    const roleOnlyFilter: { sales_user_id?: string } = {};
    if (queryFilter.sales_user_id) {
      roleOnlyFilter.sales_user_id = queryFilter.sales_user_id;
    }
    const allUserProjects = await prisma.projects.findMany({
      where: roleOnlyFilter,
      select: { status: true },
    });
    const countsMap: Record<string, number> = {};
    allUserProjects.forEach(p => { countsMap[p.status] = (countsMap[p.status] || 0) + 1; });
    const availableStatusesForUser = Object.entries(countsMap).map(([status, count]) => ({ status, count }));

    // Initialize pipeline structure based on selected statuses
    const pipeline: PipelineData = selectedStatuses.reduce((acc, s) => {
      acc[s] = { items: [], totalValue: 0 };
      return acc;
    }, {} as PipelineData);

    // Build user map for sales users
    const salesUserIds = Array.from(new Set(projects.map(p => p.sales_user_id).filter(Boolean))) as string[];
    let salesUserMap: Record<string, { id: string; name: string; email: string } > = {};
    if (salesUserIds.length > 0) {
      const users = await prisma.users.findMany({
        where: { id: { in: salesUserIds } },
        select: { id: true, email: true, employee: { select: { full_name: true } } }
      });
      salesUserMap = users.reduce((acc, u) => {
        acc[u.id] = {
          id: u.id,
          name: u.employee?.full_name || u.email,
          email: u.email,
        };
        return acc;
      }, {} as Record<string, { id: string; name: string; email: string }>);
    }

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
          sales_user: project.sales_user_id ? salesUserMap[project.sales_user_id] || null : null,
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
        currency: 'IDR',
        requestedStatuses: Array.isArray(dynamicStatuses) ? dynamicStatuses : defaultStatuses,
        usedStatuses: selectedStatuses,
        invalidRequestedStatuses: [],
        availableStatusesForUser
      }
    };
  }

  /**
   * Move a project card to a new status with business rules validation
   */
  async moveProjectCard(projectId: string, newStatus: string, user: UserInfo): Promise<{
    id: string;
    project_name: string;
    description: string | null;
    customer: { id: string; customer_name: string; city: string };
    status: string;
    estimated_value: any;
    contract_value: any;
    lead_score: number | null;
    estimation_status: string | null;
    priority: string;
    expected_close_date: Date | null;
    updated_at: Date;
  }> {
    // Basic validation: ensure status is a reasonable string
    const sanitized = sanitizeStatuses([newStatus], ['PROSPECT']);
    if (sanitized.length === 0 || sanitized[0] !== newStatus.toUpperCase()) {
      throw new Error('Invalid status provided - must be alphanumeric with underscores/dashes, max 100 characters');
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

    // Update project status (now accepts any valid VARCHAR value)
    const updatedProject = await prisma.projects.update({
      where: { id: projectId },
      data: { 
        status: newStatus.toUpperCase(), // Normalize to uppercase
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
      customer: (updatedProject as any).customer as { id: string; customer_name: string; city: string },
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
   * Public: Get project detail for API consumers with basic authorization
   */
  async getProjectDetail(projectId: string, user: UserInfo): Promise<any> {
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        customer: { select: { id: true, customer_name: true, city: true } }
      }
    });
    if (!project) {
      throw new Error('Project not found');
    }

    const userRoles = user.roles || (user.role ? [user.role] : []);
    // Sales can only access their own projects unless they are managers/CEO
    if (
      userRoles.includes('SALES') &&
      !userRoles.includes('CEO') &&
      !userRoles.includes('SALES_MANAGER') &&
      project.sales_user_id !== user.id
    ) {
      throw new Error('You can only view your own projects');
    }

    // Enrich sales user from users table
    let sales_user: any = null;
    if (project?.sales_user_id) {
      const user = await prisma.users.findUnique({
        where: { id: project.sales_user_id },
        select: { id: true, email: true, employee: { select: { full_name: true } } }
      });
      if (user) {
        sales_user = { id: user.id, name: user.employee?.full_name || user.email, email: user.email };
      }
    }
    return { ...project, sales_user };
  }

  /**
   * Validate business rules for status transitions
   */
  private validateStatusTransition(project: any, newStatus: string): void {
    // Business rule: Cannot move to PROPOSAL_DELIVERED without approved estimation
    if (
      project.status === 'PRE_SALES' &&
      newStatus === 'PROPOSAL_DELIVERED' &&
      project.estimation_status !== 'APPROVED'
    ) {
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
    // Resolve a human-friendly actor name:
    // 1) prefer user.name
    // 2) then user.email
    // 3) otherwise try to load from users table (employee.full_name or email)
    // 4) fallback to 'System' or user.id
    let actorName: string | null = null;
    if (user) {
      actorName = (user.name && String(user.name)) || (user.email && String(user.email)) || null;
      if (!actorName) {
        try {
          const u = await prisma.users.findUnique({ where: { id: user.id }, select: { email: true, employee: { select: { full_name: true } } } });
          if (u) {
            actorName = u.employee?.full_name || u.email || null;
          }
        } catch {
          // ignore DB lookup failures
        }
      }
    }
    if (!actorName) {
      actorName = (user && (user as any)?.id) ? String((user as any).id) : 'System';
    }
    // Try fetch project name for clearer description
    let projectName: string | null = null;
    try {
      const p = await prisma.projects.findUnique({ where: { id: projectId }, select: { project_name: true } });
      projectName = p?.project_name || null;
    } catch {
      projectName = null;
    }

    const description = projectName
      ? `Project '${projectName}' dipindah dari '${oldStatus}' menjadi '${newStatus}' oleh ${actorName}`
      : `Status diubah dari '${oldStatus}' menjadi '${newStatus}' oleh ${actorName}`;

    await prisma.project_activities.create({
      data: {
        project_id: projectId,
        activity_type: 'STATUS_CHANGE',
        description,
        performed_by: user.id,
        metadata: {
          old_status: oldStatus,
          new_status: newStatus,
          changed_by_name: actorName,
          changed_by_id: user.id,
          project_name: projectName
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
   * Public: create an arbitrary activity record for a project (used by frontend actions)
   */
  async createProjectActivity(
    projectId: string,
    activityType: string,
    description: string,
    metadata: Record<string, unknown> | null,
    user: UserInfo
  ): Promise<any> {
    // Basic checks + authorization similar to getProjectActivities
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const userRoles = user.roles || (user.role ? [user.role] : []);
    if (
      userRoles.includes('SALES') &&
      !userRoles.includes('CEO') &&
      !userRoles.includes('SALES_MANAGER') &&
      project.sales_user_id !== user.id
    ) {
      throw new Error('You can only add activities to your own projects');
    }

    // Resolve actor name similar to createActivityLog
    let actorName: string | null = null;
    if (user) {
      actorName = (user.name && String(user.name)) || (user.email && String(user.email)) || null;
      if (!actorName) {
        try {
          const u = await prisma.users.findUnique({ where: { id: user.id }, select: { email: true, employee: { select: { full_name: true } } } });
          if (u) actorName = u.employee?.full_name || u.email || null;
        } catch {
          // ignore
        }
      }
    }
    if (!actorName) actorName = (user && (user as any)?.id) ? String((user as any).id) : 'System';

    // Ensure activity_type matches the ActivityType enum in Prisma schema.
    // The enum currently allows: STATUS_CHANGE, MEETING, CALL, EMAIL, PROPOSAL_SENT,
    // DOCUMENT_UPLOAD, NOTE_ADDED, FOLLOW_UP
    const allowedTypes = new Set([
      'STATUS_CHANGE',
      'MEETING',
      'CALL',
      'EMAIL',
      'PROPOSAL_SENT',
      'DOCUMENT_UPLOAD',
      'NOTE_ADDED',
      'FOLLOW_UP',
    ]);
    const normalizedType = activityType && allowedTypes.has(activityType) ? activityType : 'NOTE_ADDED';

    const created = await prisma.project_activities.create({
      data: {
        project_id: projectId,
        activity_type: normalizedType as any,
        description,
        performed_by: user.id,
        metadata: {
          ...(metadata || {}),
          changed_by_name: actorName,
          changed_by_id: user.id,
        },
      }
    });

    return created;
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
      contract_value:
        projectData.contract_value || projectData.estimated_value || 0,
      sales_user_id: projectData.sales_user_id || user.id,
      created_by: user.id,
      updated_by: user.id,
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

  /**
   * Delete a project and related activities from the database.
   * Performs authorization checks similar to update/get.
   */
  async deleteProject(projectId: string, user: UserInfo): Promise<void> {
    // Ensure project exists
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Authorization: SALES users can only delete their own projects
    const userRoles = user.roles || (user.role ? [user.role] : []);
    if (userRoles.includes('SALES') && !userRoles.includes('CEO') && !userRoles.includes('SALES_MANAGER') && project.sales_user_id !== user.id) {
      throw new Error('You can only delete your own projects');
    }

    // Delete all related records first to avoid FK constraint issues
    // Use Promise.all for parallel deletion where safe
    try {
      await Promise.all([
        // Delete project activities (has onDelete: Cascade but we delete explicitly for safety)
        prisma.project_activities.deleteMany({ where: { project_id: projectId } }),
        // Delete project BOMs
        prisma.project_boms.deleteMany({ where: { project_id: projectId } }),
        // Delete project milestones
        prisma.project_milestones.deleteMany({ where: { project_id: projectId } }),
      ]);
      
      // Delete estimations separately as they may have their own child records
      // First get all estimation IDs for this project
      const estimations = await prisma.estimations.findMany({
        where: { project_id: projectId },
        select: { id: true }
      });
      
      if (estimations.length > 0) {
        const estimationIds = estimations.map(e => e.id);
        
        // Delete estimation items first
        await prisma.estimation_items.deleteMany({
          where: { estimation_id: { in: estimationIds } }
        });
        
        // Then delete estimations
        await prisma.estimations.deleteMany({
          where: { project_id: projectId }
        });
      }
    } catch (err) {
      console.error('Failed to delete project related records:', err);
      throw new Error('Gagal menghapus data terkait project: ' + (err as Error).message);
    }

    // Finally, delete the project row itself
    try {
      await prisma.projects.delete({ where: { id: projectId } });
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw new Error('Gagal menghapus project: ' + (err as Error).message);
    }
  }
}

export const pipelineService = new PipelineService();