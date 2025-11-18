import axios from "axios";
import { API_BASE_URL } from "../config";

export interface EngineeringDashboardData {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  volumeMetrics: {
    requestsIn: number;
    completedEstimations: number;
    avgTurnaroundTime: number;
  };
  accuracyMetrics: {
    avgDeviation: number;
    topDeviations: any[];
  };
  workloadMetrics: {
    details: Array<{
      engineerId: string | null;
      engineerName: string;
      count: number;
    }>;
    total: number;
  };
  revisionMetrics: {
    revisionRate: number;
    revisionCount: number;
    avgRevisionTime: number;
  };
  statusDistribution: Array<{
    status: string;
    count: number;
  }>;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: EngineeringDashboardData;
}

// Create axios instance with auth interceptor (reuse pattern with other APIs)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

class DashboardService {
  async getEngineeringDashboard(
    period: string = "this_quarter",
    assigneeId?: string,
  ): Promise<DashboardResponse> {
    const params: any = { period };
    if (assigneeId) {
      params.assigneeId = assigneeId;
    }

    const response = await apiClient.get(`/api/v1/dashboards/engineering`, { params });
    return response.data;
  }
}

export const dashboardService = new DashboardService();
