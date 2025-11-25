import axios, { AxiosInstance } from 'axios';
import type {
  Project,
  ProjectManager,
  BomItem,
  ApiResponse,
  Milestone,
  MilestoneTemplate,
  Task,
  TeamMember,
} from '../types';

const PROJECT_SERVICE_URL =
  import.meta.env.VITE_PROJECT_SERVICE_URL || 'http://localhost:4007';

class ProjectApi {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${PROJECT_SERVICE_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors globally
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          // redirect to the app root preserving origin (avoid hardcoded localhost)
          window.location.href = `${window.location.origin}/?redirect=project-frontend`;
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    const response = await this.api.get<ApiResponse<Project>>(
      `/projects/${projectId}`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch project');
    }
    return response.data.data;
  }

  /**
   * Get all projects with optional filters
   */
  async getProjects(filters?: {
    status?: string;
    pmUserId?: string;
    salesUserId?: string;
  }): Promise<Project[]> {
    const response = await this.api.get<ApiResponse<Project[]>>('/projects', {
      params: filters,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch projects');
    }
    return response.data.data;
  }

  /**
   * Get list of Project Managers
   */
  async getProjectManagers(): Promise<ProjectManager[]> {
    const response = await this.api.get<ApiResponse<ProjectManager[]>>(
      '/projects/project-managers'
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.message || 'Failed to fetch project managers'
      );
    }
    return response.data.data;
  }

  /**
   * Assign PM to project
   */
  async assignPm(projectId: string, pmUserId: string): Promise<Project> {
    const response = await this.api.put<ApiResponse<Project>>(
      `/projects/${projectId}/assign-pm`,
      { pmUserId }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to assign PM');
    }
    return response.data.data;
  }

  /**
   * Create or update BoM
   */
  async createOrUpdateBom(projectId: string, items: BomItem[]): Promise<any> {
    const response = await this.api.post<ApiResponse<any>>(
      `/projects/${projectId}/bom`,
      { items }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to save BoM');
    }
    return response.data.data;
  }

  // ==================== MILESTONE APIs ====================

  /**
   * Apply milestone template to project
   */
  async applyMilestoneTemplate(
    projectId: string,
    templateId: number
  ): Promise<Milestone[]> {
    const response = await this.api.post<ApiResponse<Milestone[]>>(
      `/projects/${projectId}/milestones/apply-template`,
      { templateId }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to apply template');
    }
    return response.data.data;
  }

  /**
   * Get all milestones for a project (with tasks)
   */
  async getMilestones(projectId: string): Promise<Milestone[]> {
    const response = await this.api.get<ApiResponse<Milestone[]>>(
      `/projects/${projectId}/milestones`
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch milestones');
    }
    return response.data.data;
  }

  /**
   * Create a manual milestone
   */
  async createMilestone(
    projectId: string,
    data: {
      name: string;
      start_date?: string;
      end_date?: string;
      status?: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
    }
  ): Promise<Milestone> {
    const payload: any = {
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      status: data.status,
    };
    const response = await this.api.post<ApiResponse<Milestone>>(
      `/projects/${projectId}/milestones`,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create milestone');
    }
    return response.data.data;
  }

  /**
   * Update a milestone
   */
  async updateMilestone(
    projectId: string,
    milestoneId: string,
    data: {
      name?: string;
      start_date?: string;
      end_date?: string;
      status?: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
    }
  ): Promise<Milestone> {
    const payload: any = {
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      status: data.status,
    };
    const response = await this.api.put<ApiResponse<Milestone>>(
      `/projects/${projectId}/milestones/${milestoneId}`,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update milestone');
    }
    return response.data.data;
  }

  /**
   * Delete a milestone (PM only)
   */
  async deleteMilestone(projectId: string, milestoneId: string): Promise<void> {
    const response = await this.api.delete<ApiResponse<void>>(
      `/projects/${projectId}/milestones/${milestoneId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete milestone');
    }
  }

  /**
   * Get available milestone templates
   */
  async getMilestoneTemplates(
    projectType?: string
  ): Promise<MilestoneTemplate[]> {
    const response = await this.api.get<ApiResponse<MilestoneTemplate[]>>(
      '/templates/milestones',
      { params: projectType ? { projectType } : {} }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch templates');
    }
    return response.data.data;
  }

  /**
   * Get team members for a project (for assignment)
   * Fallback: returns project managers list mapped to TeamMember if endpoint missing
   */
  async getProjectTeam(projectId: string): Promise<TeamMember[]> {
    // Temporarily fallback to project managers (team-members endpoint not implemented yet)
    const managers = await this.getProjectManagers();
    return managers.map((m) => ({
      id: m.id,
      name: m.employee?.full_name || m.email,
      role: m.employee?.position,
    }));
  }

  // ==================== TASK APIs ====================

  /**
   * Create a task
   */
  async createTask(
    projectId: string,
    data: {
      milestone_id?: string;
      name: string;
      description?: string;
      assignee_id?: string;
      start_date?: string;
      due_date?: string;
      status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
      progress?: number;
    }
  ): Promise<Task> {
    const payload: any = {
      milestoneId: data.milestone_id,
      taskName: data.name,
      description: data.description,
      assigneeId: data.assignee_id,
      startDate: data.start_date,
      endDate: data.due_date,
      status: data.status,
      progress: data.progress,
    };
    const response = await this.api.post<ApiResponse<Task>>(
      `/projects/${projectId}/tasks`,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create task');
    }
    return response.data.data;
  }

  /**
   * Get all tasks for a project
   */
  async getTasks(
    projectId: string,
    filters?: { milestone_id?: string; assignee_id?: string }
  ): Promise<Task[]> {
    const params: any = {};
    if (filters?.milestone_id) params.milestoneId = filters.milestone_id;
    if (filters?.assignee_id) params.assigneeId = filters.assignee_id;
    const response = await this.api.get<ApiResponse<Task[]>>(
      `/projects/${projectId}/tasks`,
      { params }
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch tasks');
    }
    return response.data.data;
  }

  /**
   * Update a task (PM can edit all, assignee can edit status/progress only)
   */
  async updateTask(
    projectId: string,
    taskId: string,
    data: {
      milestone_id?: string;
      name?: string;
      description?: string;
      assignee_id?: string;
      start_date?: string;
      due_date?: string;
      status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
      progress?: number;
    }
  ): Promise<Task> {
    const payload: any = {
      name: data.name,
      assigneeId: data.assignee_id,
      description: data.description,
      status: data.status,
      startDate: data.start_date,
      endDate: data.due_date,
      progress: data.progress,
    };
    const response = await this.api.put<ApiResponse<Task>>(
      `/projects/${projectId}/tasks/${taskId}`,
      payload
    );
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update task');
    }
    return response.data.data;
  }

  /**
   * Delete a task (PM only)
   */
  async deleteTask(projectId: string, taskId: string): Promise<void> {
    const response = await this.api.delete<ApiResponse<void>>(
      `/projects/${projectId}/tasks/${taskId}`
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete task');
    }
  }
}

export const projectApi = new ProjectApi();
