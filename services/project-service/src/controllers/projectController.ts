import { Response } from 'express';
import { ProjectService } from '../services/projectService';
import { AuthRequest } from '../middlewares/authMiddleware';

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
}
