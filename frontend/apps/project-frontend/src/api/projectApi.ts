import axios, { AxiosInstance } from 'axios';
import type {
  Project,
  ProjectManager,
  BomItem,
  ApiResponse,
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
          window.location.href = 'http://localhost:3000/?redirect=project-frontend';
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
  async createOrUpdateBom(
    projectId: string,
    items: BomItem[]
  ): Promise<any> {
    const response = await this.api.post<ApiResponse<any>>(
      `/projects/${projectId}/bom`,
      { items }
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to save BoM');
    }
    return response.data.data;
  }
}

export const projectApi = new ProjectApi();
