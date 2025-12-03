import { Request, Response } from 'express';
import { milestoneService } from '../services/milestoneService';

export class MilestoneController {
  /**
   * Apply milestone template to project
   * POST /api/v1/projects/:projectId/milestones/apply-template
   */
  async applyTemplate(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { templateId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!templateId) {
        return res.status(400).json({ message: 'Template ID is required' });
      }

      const milestones = await milestoneService.applyTemplate(
        projectId,
        templateId,
        userId
      );

      return res.status(201).json({
        success: true,
        data: milestones,
        message: 'Template applied successfully',
      });
    } catch (error: any) {
      console.error('Error applying template:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to apply template',
      });
    }
  }

  /**
   * Get project milestones
   * GET /api/v1/projects/:projectId/milestones
   */
  async getMilestones(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const milestones = await milestoneService.getMilestones(projectId);

      return res.status(200).json({
        success: true,
        data: milestones,
      });
    } catch (error: any) {
      console.error('Error fetching milestones:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch milestones',
      });
    }
  }

  /**
   * Create manual milestone
   * POST /api/v1/projects/:projectId/milestones
   */
  async createMilestone(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const milestone = await milestoneService.createMilestone(
        projectId,
        req.body,
        userId
      );

      return res.status(201).json({
        success: true,
        data: milestone,
        message: 'Milestone created successfully',
      });
    } catch (error: any) {
      console.error('Error creating milestone:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create milestone',
      });
    }
  }

  /**
   * Update milestone
   * PUT /api/v1/projects/:projectId/milestones/:milestoneId
   */
  async updateMilestone(req: Request, res: Response) {
    try {
      const { milestoneId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const milestone = await milestoneService.updateMilestone(
        milestoneId,
        req.body,
        userId
      );

      return res.status(200).json({
        success: true,
        data: milestone,
        message: 'Milestone updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating milestone:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update milestone',
      });
    }
  }

  /**
   * Delete milestone
   * DELETE /api/v1/projects/:projectId/milestones/:milestoneId
   */
  async deleteMilestone(req: Request, res: Response) {
    try {
      const { milestoneId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await milestoneService.deleteMilestone(milestoneId, userId);

      return res.status(200).json({
        success: true,
        message: 'Milestone deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting milestone:', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to delete milestone',
      });
    }
  }

  /**
   * Get milestone templates
   * GET /api/v1/templates/milestones
   */
  async getTemplates(req: Request, res: Response) {
    try {
      const { projectType } = req.query;

      const templates = await milestoneService.getTemplates(
        projectType as string
      );

      return res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch templates',
      });
    }
  }
}

export const milestoneController = new MilestoneController();
