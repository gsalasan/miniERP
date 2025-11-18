import { Request, Response } from 'express';
import { pipelineService } from '../services/pipelineServices';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    name: string;
  };
}

// GET /api/v1/pipeline
export const getPipeline = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loggedInUser = req.user;
    const { sales_user_id, statuses } = req.query as { sales_user_id?: string; statuses?: string };
    
    console.log('[pipelineController.getPipeline] request', {
      user: loggedInUser?.id,
      roles: (loggedInUser as any)?.roles || loggedInUser?.role,
      rawStatusesParam: statuses,
      sales_user_id
    });
    
    if (!loggedInUser) {
      console.log('No authenticated user found');
      return res.status(401).json({ error: 'Unauthorized' });
    }

  console.log('[pipelineController.getPipeline] fetching data for', loggedInUser.id);
  const statusesList = statuses
    ? statuses.split(',').map(s => String(s).trim()).filter(Boolean)
    : undefined;
  console.log('[pipelineController.getPipeline] parsed statusesList', statusesList);
  const result = await pipelineService.getPipelineData(loggedInUser, sales_user_id, statusesList);
    
    console.log('[pipelineController.getPipeline] result summary', {
      pipelineKeys: Object.keys(result.pipeline),
      totalOpportunities: result.summary?.totalOpportunities,
      invalidRequestedStatuses: result.summary?.invalidRequestedStatuses,
      usedStatuses: result.summary?.usedStatuses,
      requestedStatuses: result.summary?.requestedStatuses
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching pipeline:', error);
    
    if (error.message === 'Insufficient permissions') {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/v1/pipeline/projects/:projectId - Get single project detail
export const getProjectById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loggedInUser = req.user;
    const { projectId } = req.params;

    if (!loggedInUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const project = await pipelineService.getProjectDetail(projectId, loggedInUser);
    res.json({ success: true, data: project });
  } catch (error) {
    if ((error as Error).message === 'Project not found') {
      return res.status(404).json({ error: 'Project not found' });
    }
    if ((error as Error).message === 'You can only view your own projects') {
      return res.status(403).json({ error: 'Forbidden: You can only view your own projects' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/v1/pipeline/move
export const movePipelineCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loggedInUser = req.user;
    const { projectId, newStatus } = req.body;

    if (!loggedInUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    if (!projectId || !newStatus) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'projectId and newStatus are required'
      });
    }

    const updatedProject = await pipelineService.moveProjectCard(projectId, newStatus, loggedInUser);

    res.json({
      success: true,
      data: updatedProject,
      message: `Project status successfully updated to ${newStatus}`
    });

  } catch (error) {
    console.error('Error moving pipeline card:', error);
    
    // Handle specific business errors
    if (error.message === 'Project not found') {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (error.message === 'You can only move your own projects') {
      return res.status(403).json({ error: 'Forbidden: You can only move your own projects' });
    }
    
    if (error.message === 'Invalid status provided') {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid status provided'
      });
    }
    
    if (error.message.includes('Tidak bisa')) {
      return res.status(400).json({ 
        error: 'Business Rule Violation',
        message: error.message
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/v1/pipeline/activities/:projectId
export const getProjectActivities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loggedInUser = req.user;
    const { projectId } = req.params;

    if (!loggedInUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const activities = await pipelineService.getProjectActivities(projectId, loggedInUser);

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Error fetching project activities:', error);
    
    if (error.message === 'Project not found') {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (error.message === 'You can only view activities of your own projects') {
      return res.status(403).json({ error: 'Forbidden: You can only view activities of your own projects' });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/v1/pipeline/projects
export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loggedInUser = req.user;
    const projectData = req.body;

    if (!loggedInUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    const requiredFields = ['project_name', 'customer_id'];
    for (const field of requiredFields) {
      if (!projectData[field]) {
        return res.status(400).json({ 
          error: 'Bad Request',
          message: `${field} is required`
        });
      }
    }

  const project = await pipelineService.createProject(projectData, loggedInUser);

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });

  } catch (error: any) {
    console.error('Error creating project:', error);
    // Handle duplicate project_number gracefully
    if (error?.message === 'DUPLICATE_PROJECT_NUMBER') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'project_number already exists'
      });
    }
    if (error?.message === 'FAILED_TO_GENERATE_UNIQUE_PROJECT_NUMBER') {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate a unique project number. Please retry.'
      });
    }
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// PUT /api/v1/pipeline/projects/:projectId
export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loggedInUser = req.user;
    const { projectId } = req.params;
    const updateData = req.body;

    if (!loggedInUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updatedProject = await pipelineService.updateProject(projectId, updateData, loggedInUser);

    res.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Error updating project:', error);
    
    if (error.message === 'Project not found') {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (error.message === 'You can only update your own projects') {
      return res.status(403).json({ error: 'Forbidden: You can only update your own projects' });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/v1/pipeline/activities - create a project activity (used by frontend actions like checklist)
export const createProjectActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loggedInUser = req.user;
    const { projectId, activityType, description, metadata } = req.body as {
      projectId?: string;
      activityType?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    };

    if (!loggedInUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!projectId || !description) {
      return res.status(400).json({ error: 'Bad Request', message: 'projectId and description are required' });
    }

    const created = await pipelineService.createProjectActivity(
      projectId,
      activityType || 'CUSTOM',
      description,
      metadata || null,
      loggedInUser
    );

    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error creating project activity:', error);
    if (error.message === 'Project not found') {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (error.message === 'You can only add activities to your own projects') {
      return res.status(403).json({ error: 'Forbidden: You can only add activities to your own projects' });
    }
    res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// DELETE /api/v1/pipeline/projects/:projectId
export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const loggedInUser = req.user;
    const { projectId } = req.params;

    if (!loggedInUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await pipelineService.deleteProject(projectId, loggedInUser);

    // Return 204 No Content to indicate deletion
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting project:', error);
    if (error.message === 'Project not found') {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (error.message === 'You can only delete your own projects') {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own projects' });
    }
    res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};