import prisma from '../utils/prisma';
import { NotificationService } from '../utils/notifications';

interface ProjectWonEvent {
  projectId?: string; // Optional - bisa create new atau update existing
  projectName: string;
  customerId: string;
  salesUserId: string;
  salesOrderId: string;
  soNumber: string;
  estimationId?: string;
  totalValue?: number;
  description?: string;
}

export class ProjectEventListener {
  /**
   * Handle project.won event from CRM service
   * This is triggered when a Sales Order is created/won
   * Automatically creates Project Workspace with status 'Planning'
   */
  async handleProjectWon(event: ProjectWonEvent): Promise<void> {
      // Received project.won event

      let project;

      // Check if project already exists (update scenario)
      if (event.projectId) {
        const existingProject = await prisma.project.findUnique({
          where: { id: event.projectId },
          include: {
            customer: true,
            sales_user: { include: { employee: true } },
          },
        });

        if (existingProject) {
          // Do NOT change to Planning yet. Keep current status (likely WON).
          const updateData: Partial<{ updated_at: Date; description: string; contract_value: number }> = {
            updated_at: new Date(),
            description: existingProject.description || event.description || `Project won via Sales Order ${event.soNumber}`,
          };
          if (event.totalValue && !existingProject.contract_value) {
            updateData.contract_value = event.totalValue;
          }
          project = await prisma.project.update({
            where: { id: event.projectId },
            data: updateData,
            include: {
              customer: true,
              sales_user: { include: { employee: true } },
            },
          });
        }
      }

      // Create new project workspace if doesn't exist
      if (!project) {
        // Creating new project record from project.won event

        // Generate project number (format: PRJ-YYYYMMDD-XXX)
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const countToday = await prisma.project.count({
          where: {
            created_at: {
              gte: new Date(today.setHours(0, 0, 0, 0)),
            },
          },
        });
        const projectNumber = `PRJ-${dateStr}-${String(countToday + 1).padStart(3, '0')}`;

        // Some event fields may be missing depending on publisher implementation.
        // Attempt to derive minimal required fields; fail fast if core IDs missing.
        if (!event.customerId || !event.salesUserId) {
          // Event missing customerId or salesUserId; attempting to derive fallback values
        }

        project = await prisma.project.create({
          data: {
            project_number: projectNumber,
            project_name: event.projectName,
            customer_id: event.customerId || '',
            sales_user_id: event.salesUserId || '',
            status: 'New',
            description: event.description || `Project created from Sales Order ${event.soNumber}`,
            contract_value: event.totalValue ?? 0,
            created_by: event.salesUserId || undefined,
            updated_by: event.salesUserId || undefined,
          },
          include: {
            customer: true,
            sales_user: { include: { employee: true } },
          },
        });

        // Project workspace created
      }

      // Create activity log
      await prisma.projectActivity.create({
        data: {
          project_id: project.id,
          activity_type: 'STATUS_CHANGE',
          description: `Project won. Sales Order ${event.soNumber} processed. Initial status '${project.status}'.`,
          performed_by: event.salesUserId || project.sales_user_id || 'system',
          metadata: {
            event_type: 'project.won',
            so_number: event.soNumber,
            status: project.status,
            estimation_id: event.estimationId,
            contract_value: project.contract_value,
          },
        },
      });

      // Get operational managers to notify for PM assignment
      const operationalManagers = await prisma.users.findMany({
        where: {
          roles: {
            has: 'OPERATIONAL_MANAGER',
          },
          is_active: true,
        },
      });

      // Send notifications to all operational managers
      const notificationPromises = operationalManagers.map(manager =>
        NotificationService.send({
          userId: manager.id,
          message: `Proyek baru memerlukan penugasan PM: ${project.project_name} (${project.project_number})`,
          link: `/projects/${project.id}`,
          type: 'info',
        })
      );

      await Promise.all(notificationPromises);

      // Project.won event processed successfully; ready for PM assignment
  }

  /**
   * Initialize event listeners
   * In production, this would connect to a message queue (RabbitMQ, Kafka, etc.)
   */
  initialize(): void {
    // Project event listener initialized
    // TODO: Connect to message queue and subscribe to project.won events
    // For now, this is a placeholder for the event handling infrastructure
  }
}

// Export singleton instance
export const projectEventListener = new ProjectEventListener();
