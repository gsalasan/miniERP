import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import { ProjectService } from '../services/projectService';

const projectService = new ProjectService();

export class DashboardController {
  // GET /api/v1/dashboards/projects/:projectId
  async getProjectDashboard(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const user = req.user;

      // Authorization: ensure user exists
      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Load project with relations
      const project = await projectService.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      const now = new Date();

      // Milestones and timeline status
      const milestones = await prisma.project_milestones.findMany({ where: { project_id: projectId } });
      const overdueMilestones = milestones.filter(m => m.end_date && new Date(m.end_date) < now && String(m.status).toUpperCase() !== 'DONE');
      let timelineStatus = 'On Track';
      if (overdueMilestones.length > 0) timelineStatus = 'Overdue';

      // Budget status
      const estimated = Number(project.estimated_hpp ?? project.estimated_value ?? 0);
      const actual = Number(project.actual_cost ?? 0);
      const budgetStatus = actual > estimated && estimated > 0 ? 'Over Budget' : 'Under Budget';
      const budgetUsedPercentage = estimated > 0 ? Math.round((actual / estimated) * 100) : 0;

      // Progress overall (tasks)
      const completedTasks = await prisma.project_tasks.count({ where: { project_milestones: { project_id: projectId }, status: 'DONE' } });
      const totalTasks = await prisma.project_tasks.count({ where: { project_milestones: { project_id: projectId } } });
      const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Urgent tasks (not DONE), ordered by due_date
      const urgentTasks = await prisma.project_tasks.findMany({
        where: { project_milestones: { project_id: projectId }, NOT: { status: 'DONE' } },
        include: { assignee: { include: { employees: true } } },
        orderBy: { due_date: 'asc' },
        take: 5,
      });

      return res.status(200).json({
        success: true,
        data: {
          timelineStatus,
          budgetStatus,
          budgetUsedPercentage,
          overallProgress,
          urgentTasks,
          milestones,
          project,
          // expose computed values for frontend convenience
          estimated_hpp: estimated,
          actual_cost: actual,
        },
      });
    } catch (err: any) {
      console.error('Error in getProjectDashboard:', err?.stack || err?.message || err);
      return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
  }

  // GET /api/v1/dashboards/operations
  async getOperationsDashboard(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      // Only operational manager or CEO allowed
      const roles = (user.roles || (user.role ? [user.role] : [])).map((r: string) => (r || '').toString().toUpperCase());
      if (!roles.includes('OPERATIONAL_MANAGER') && !roles.includes('CEO')) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const period = (req.query.period as string) || 'this_quarter';
      // Parse period to date range
      const now = new Date();
      let startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      if (period === 'this_year') startDate = new Date(now.getFullYear(), 0, 1);
      if (period === 'this_quarter') {
        const q = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), q * 3, 1);
      }

      // Active projects: those that have start_date in range OR status indicates in-progress
      const activeProjects = await prisma.projects.findMany({
        where: {
          OR: [
            { start_date: { gte: startDate, lte: now } },
            { status: { in: ['IN_PROGRESS', 'InProgress', 'INPROGRESS', 'PLANNING', 'Planning'] } },
          ],
        },
        // Include related customer and PM info so frontend can render
        // the same fields as the main Projects list (e.g. customer.customer_name)
        include: {
          project_milestones: true,
          sales_orders: true,
          customers: {
            select: {
              id: true,
              customer_name: true,
              city: true,
              status: true,
            },
          },
        },
      });

      const totalActiveProjects = activeProjects.length;
      const totalContractValue = activeProjects.reduce((sum, p) => {
        const contract = (p.contract_value ?? (p.sales_orders && p.sales_orders[0]?.contract_value) ?? 0) as any;
        return Number(sum) + Number(contract || 0);
      }, 0);

      // Portfolio health
      let onTrack = 0, atRisk = 0, overdue = 0;
      for (const p of activeProjects) {
        const m = p.project_milestones || [];
        const overdueCount = m.filter((ms:any) => ms.end_date && new Date(ms.end_date) < now && String(ms.status).toUpperCase() !== 'DONE').length;
        if (overdueCount > 0) overdue += 1;
        else onTrack += 1;
      }

      // Team utilization: count IN_PROGRESS tasks group by assignee
      const utilization = await prisma.project_tasks.groupBy({
        by: ['assignee_id'],
        where: { status: 'IN_PROGRESS' },
        _count: { id: true },
      });

      const teamUtilization = await Promise.all(utilization.map(async u => {
        const userRec = u.assignee_id ? await prisma.users.findUnique({ where: { id: u.assignee_id }, include: { employees: true } }) : null;
        return { assigneeName: userRec?.employees?.full_name || userRec?.email || 'Unassigned', count: u._count.id };
      }));

      // Vendor performance: placeholder - return empty list for now (can be implemented when ratings available)
      const vendorPerformance: any[] = [];

      // Debug log: show how many projects and whether `customer` is present
      // (remove or lower verbosity after troubleshooting)
      try {
        // eslint-disable-next-line no-console
        console.log('[OPS DASH] activeProjects:', activeProjects.length, activeProjects.map(p => ({ id: p.id, hasCustomer: !!p.customers, customerName: p.customers?.customer_name })));
      } catch (e) {
        // ignore logging errors
      }

      // Normalize response: customers -> customer (singular) for each project
      const normalizedProjects = activeProjects.map(project => ({
        ...project,
        customer: project.customers,
        customers: undefined,
      }));

      return res.status(200).json({
        success: true,
        data: {
          totalActiveProjects,
          totalContractValue,
          averageMargin: 0,
          portfolioHealth: { onTrack, atRisk, overdue },
          vendorPerformance,
          projectList: normalizedProjects,
          teamUtilization,
        },
      });
    } catch (err: any) {
      console.error('Error in getOperationsDashboard:', err?.stack || err?.message || err);
      return res.status(500).json({ success: false, message: err.message || 'Internal server error' });
    }
  }
}

export const dashboardController = new DashboardController();

export default dashboardController;
