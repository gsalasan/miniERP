import axios from 'axios';

const PROJECT_SERVICE_URL =
  import.meta.env.VITE_PROJECT_SERVICE_URL || 'http://localhost:4007';

const api = axios.create({
  baseURL: `${PROJECT_SERVICE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Project {
  id: string;
  project_name: string;
  project_number: string;
  customer_id: string;
  contract_value: number;
  status: string;
  pm_user_id: string | null;
  sales_user_id: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
  };
  pm_user?: {
    id: string;
    email: string;
    employee?: {
      full_name: string;
    };
  };
  sales_user?: {
    id: string;
    email: string;
    employee?: {
      full_name: string;
    };
  };
  estimations?: Array<{
    id: string;
    version: number;
    items: Array<{
      id: string;
      item_id: string;
      item_type: string;
      quantity: number;
    }>;
  }>;
  project_boms?: Array<{
    id: string;
    item_id: string;
    item_type: string;
    quantity: number;
  }>;
}

export interface ProjectManager {
  id: string;
  email: string;
  employee?: {
    full_name: string;
    position: string;
  };
}

export interface BomItem {
  itemId: string;
  itemType: 'MATERIAL' | 'SERVICE';
  quantity: number;
}

export const projectApi = {
  getProject: async (projectId: string): Promise<Project> => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data.data;
  },

  getProjects: async (filters?: {
    status?: string;
    pmUserId?: string;
    salesUserId?: string;
  }): Promise<Project[]> => {
    const response = await api.get('/projects', { params: filters });
    return response.data.data;
  },

  getProjectManagers: async (): Promise<ProjectManager[]> => {
    const response = await api.get('/projects/project-managers');
    return response.data.data;
  },

  assignPm: async (
    projectId: string,
    pmUserId: string
  ): Promise<Project> => {
    const response = await api.put(`/projects/${projectId}/assign-pm`, {
      pmUserId,
    });
    return response.data.data;
  },

  createOrUpdateBom: async (
    projectId: string,
    items: BomItem[]
  ): Promise<any> => {
    const response = await api.post(`/projects/${projectId}/bom`, { items });
    return response.data.data;
  },
};
