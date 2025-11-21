import axios from "axios";
import {
  Project,
  Pipeline,
  PipelineResponse,
  MovePipelineRequest,
  MovePipelineResponse,
  ProjectActivity,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectStatus,
} from "../types/pipeline";
import { config, auth } from "../config";

// Create axios instance for CRM service
const crmApi = axios.create({
  baseURL: config.CRM_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor to include auth token
crmApi.interceptors.request.use(
  (config) => {
    // Support either 'authToken' or legacy 'token' keys saved by the login flow
    const token =
      localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle errors
crmApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access: remove any saved token keys
      localStorage.removeItem(auth.TOKEN_KEY);
      localStorage.removeItem(auth.LEGACY_TOKEN_KEY);
      // Redirect to login if needed
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const pipelineApi = {
  // Get pipeline data (Kanban board)
  getPipeline: async (salesUserId?: string, statuses?: string[]): Promise<PipelineResponse> => {
    try {
      const params: any = {};
      if (salesUserId) params.sales_user_id = salesUserId;
      if (Array.isArray(statuses) && statuses.length > 0) {
        params.statuses = statuses.join(",");
      }

      console.log("[Pipeline API] Sending request with params:", params);

      const response = await crmApi.get("/pipeline", { params });

      // Expected payload: { success: true, data: { pipeline, summary } }
      const root = response?.data;
      const wrapped = root?.data || root; // tolerate either nesting
      const pipeline: Pipeline = wrapped?.pipeline || {};
      const summary = wrapped?.summary || {};

      // Expose debug summary to window for the debug panel
      (window as any).__PIPELINE_DEBUG_SUMMARY = {
        requestedStatuses: summary.requestedStatuses,
        usedStatuses: summary.usedStatuses,
        invalidRequestedStatuses: summary.invalidRequestedStatuses,
        availableStatusesForUser: summary.availableStatusesForUser,
      };

      const totalOpportunities = Number(
        summary.totalOpportunities ??
          Object.values(pipeline).reduce(
            (acc: number, col: any) => acc + (col.items?.length || 0),
            0,
          ),
      );
      const totalValue = Number(
        summary.totalValue ??
          Object.values(pipeline).reduce((acc: number, col: any) => acc + (col.totalValue || 0), 0),
      );

      return { pipeline, totalOpportunities, totalValue };
    } catch (err: any) {
      // Try to surface backend message if available to aid debugging
      const backendMessage =
        err?.response?.data?.message || err?.response?.data?.error || err?.message;
      throw new Error(backendMessage || "Gagal memuat data pipeline");
    }
  },

  // Move project card to different column
  movePipelineCard: async (request: MovePipelineRequest): Promise<MovePipelineResponse> => {
    try {
      const response = await crmApi.put("/pipeline/move", request);
      return response.data;
    } catch (error: unknown) {
      // Extract error message from backend response
      const errorMessage =
        (error as any).response?.data?.message || "Gagal memindahkan kartu pipeline";
      throw new Error(errorMessage);
    }
  },

  // Get project activities
  getProjectActivities: async (projectId: string): Promise<ProjectActivity[]> => {
    try {
      const response = await crmApi.get(`/pipeline/activities/${projectId}`);
      return response.data.data || response.data;
    } catch {
      throw new Error("Gagal memuat aktivitas proyek");
    }
  },

  // Create a project activity (used by frontend actions such as checklist CRUD)
  createProjectActivity: async (
    projectId: string,
    activityType: string,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<any> => {
    try {
      const response = await crmApi.post("/pipeline/activities", {
        projectId,
        activityType,
        description,
        metadata,
      });
      return response.data.data || response.data;
    } catch (err) {
      const errorMessage = (err as any).response?.data?.message || "Gagal membuat aktivitas proyek";
      throw new Error(errorMessage);
    }
  },

  // Create new project
  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    try {
      const response = await crmApi.post("/pipeline/projects", data);
      return response.data.data || response.data;
    } catch (error: unknown) {
      // Extract error message from backend response
      const errorMessage = (error as any).response?.data?.message || "Gagal membuat proyek baru";
      throw new Error(errorMessage);
    }
  },

  // Update project
  updateProject: async (projectId: string, data: UpdateProjectRequest): Promise<Project> => {
    try {
      const response = await crmApi.put(`/pipeline/projects/${projectId}`, data);
      return response.data.data || response.data;
    } catch (error: unknown) {
      // Extract error message from backend response
      const errorMessage = (error as any).response?.data?.message || "Gagal mengupdate proyek";
      throw new Error(errorMessage);
    }
  },

  // Get project by ID
  getProjectById: async (projectId: string): Promise<Project> => {
    try {
      const response = await crmApi.get(`/pipeline/projects/${projectId}`);
      return response.data.data || response.data;
    } catch {
      throw new Error("Gagal memuat data proyek");
    }
  },
  // Delete project
  deleteProject: async (projectId: string): Promise<void> => {
    try {
      await crmApi.delete(`/pipeline/projects/${projectId}`);
    } catch (error: unknown) {
      // If backend does not implement DELETE for projects (404), try a safe fallback:
      // mark the project as LOST so it leaves active pipeline columns.
      const statusCode = (error as any).response?.status;
      console.error("[pipelineApi.deleteProject] error status:", statusCode);
      console.error("[pipelineApi.deleteProject] response data:", (error as any).response?.data);

      if (statusCode === 404) {
        try {
          await crmApi.put(`/pipeline/projects/${projectId}`, {
            status: ProjectStatus.LOST,
          } as UpdateProjectRequest);
          return;
        } catch (putErr) {
          console.error("[pipelineApi.deleteProject] fallback update error:", putErr);
          const fallbackMessage =
            (putErr as any).response?.data?.message ||
            (putErr as any).message ||
            "Gagal menghapus proyek (fallback gagal)";
          throw new Error(fallbackMessage);
        }
      }

      const errorMessage =
        (error as any).response?.data?.message ||
        (error as any).message ||
        "Gagal menghapus proyek";
      throw new Error(errorMessage);
    }
  },
};

export default pipelineApi;
