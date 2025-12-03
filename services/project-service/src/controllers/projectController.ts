import { Response } from 'express';
import prisma from '../utils/prisma';
import { ProjectService } from '../services/projectService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { NotificationService } from '../utils/notifications';

const projectService = new ProjectService();

export class ProjectController {
  async getProject(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;

      const project = await projectService.getProjectById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error: any) {
      console.error('Error getting project:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async getProjects(req: AuthRequest, res: Response) {
    try {
      console.log('[GET PROJECTS] Request received');
      console.log('[GET PROJECTS] User:', req.user);
      console.log('[GET PROJECTS] Query params:', req.query);
      
      const { status, pmUserId, salesUserId } = req.query;

      console.log('[GET PROJECTS] Calling projectService.getProjects...');
      const projects = await projectService.getProjects({
        status: status as string,
        pmUserId: pmUserId as string,
        salesUserId: salesUserId as string,
      });

      console.log(`[GET PROJECTS] Success! Found ${projects.length} projects`);
      return res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error: any) {
      console.error('[GET PROJECTS] ERROR:', error.message);
      console.error('[GET PROJECTS] Stack:', error.stack);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async assignPm(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const { pmUserId } = req.body;
      const loggedInUserId = req.user?.id;

      if (!loggedInUserId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      if (!pmUserId) {
        return res.status(400).json({
          success: false,
          message: 'pmUserId is required',
        });
      }

      const updatedProject = await projectService.assignPmToProject(
        projectId,
        { pmUserId },
        loggedInUserId
      );

      return res.status(200).json({
        success: true,
        data: updatedProject,
        message: 'Project Manager assigned successfully',
      });
    } catch (error: any) {
      console.error('Error assigning PM:', error);

      if (error.message.includes('Forbidden')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async createOrUpdateBom(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const { items } = req.body;
      const loggedInUserId = req.user?.id;

      if (!loggedInUserId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: 'items array is required',
        });
      }

      const bomItems = await projectService.createOrUpdateBom(
        projectId,
        { items },
        loggedInUserId
      );

      return res.status(201).json({
        success: true,
        data: bomItems,
        message: 'BoM saved successfully',
      });
    } catch (error: any) {
      console.error('Error creating/updating BoM:', error);

      if (error.message.includes('Forbidden')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async createRfp(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const { items, notes } = req.body;
      const loggedInUserId = req.user?.id;

      if (!loggedInUserId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'items array is required' });
      }

      const rfp = await projectService.createRfp(projectId, { items, notes }, loggedInUserId);

      return res.status(201).json({ success: true, data: rfp, message: 'RFP created successfully' });
    } catch (error: any) {
      console.error('Error creating RFP:', error);

      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ success: false, message: error.message });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  async getProjectManagers(req: AuthRequest, res: Response) {
    try {
      const pms = await projectService.getProjectManagers();

      return res.status(200).json({
        success: true,
        data: pms,
      });
    } catch (error: any) {
      console.error('Error getting project managers:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  // GET /api/v1/projects/progress-summary
  async getProgressSummary(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      // Fetch projects
      const projects = await prisma.projects.findMany({
        select: { id: true, project_code: true, estimated_value: true, actual_cost: true, start_date: true, expected_close_date: true },
      });

      const results = [] as any[];

      for (const p of projects) {
        // Physical progress: sum(progress * weight_pct / 100)
        const tasks = await prisma.project_tasks.findMany({ where: { project_id: p.id } });
        const physicalSum = tasks.reduce((sum, t) => {
          const prog = Number(t.progress ?? 0);
          const weight = (t as any).weight_pct !== null && (t as any).weight_pct !== undefined ? Number((t as any).weight_pct) : 100;
          return sum + (prog * weight) / 100;
        }, 0);

        const physical_progress_pct = Math.round(physicalSum || 0);

        // Financial progress: actual_cost / estimated_value * 100
        const financial_progress_pct = p.estimated_value && Number(p.estimated_value) > 0 ? Math.round((Number(p.actual_cost ?? 0) / Number(p.estimated_value)) * 100) : 0;

        const overall_progress_pct = Math.round((physical_progress_pct * 0.5) + (financial_progress_pct * 0.5));

        // Scheduled percent based on time elapsed between start_date and expected_close_date
        let scheduled_pct = 0;
        if (p.start_date && p.expected_close_date) {
          const now = Date.now();
          const start = new Date(p.start_date).getTime();
          const end = new Date(p.expected_close_date).getTime();
          if (end > start) {
            scheduled_pct = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
          }
        }

        const project_delayed_total = overall_progress_pct < (scheduled_pct - 15);

        // Send notification for delayed projects (best-effort)
        if (project_delayed_total) {
          try {
            // Use NotificationService to send to configured webhook (channel configured there)
            const { NotificationService } = require('../utils/notifications');
            await NotificationService.send({ userId: 'system', message: `#project-delay Project ${p.project_code || p.id} is delayed: overall ${overall_progress_pct}% vs scheduled ${scheduled_pct}%`, type: 'warning' });
          } catch (e) {
            console.warn('Failed to send delay notification', e?.message || e);
          }
        }

        results.push({
          project_id: p.id,
          project_code: p.project_code,
          physical_progress_pct,
          financial_progress_pct,
          overall_progress_pct,
          scheduled_pct,
          project_delayed_total,
        });
      }

      return res.status(200).json({ success: true, data: results });
    } catch (error: any) {
      console.error('Error in getProgressSummary:', error);
      return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }
}
