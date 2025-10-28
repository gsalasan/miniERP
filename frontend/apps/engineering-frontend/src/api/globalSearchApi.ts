import axios from "axios";

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export interface GlobalSearchResult {
  id: string;
  type: "material" | "service";
  name: string;
  code?: string;
  category?: string;
  description?: string;
  status?: string;
  cost?: number;
  currency?: string;
  unit?: string;
  created_at: string;
  updated_at: string;
}

export interface GlobalSearchResponse {
  success: boolean;
  message: string;
  data: GlobalSearchResult[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  summary: {
    materialCount: number;
    serviceCount: number;
    totalCount: number;
  };
  query: {
    q: string;
    type: string;
    page: number;
    limit: number;
  };
}

export interface GlobalSearchParams {
  q: string;
  page?: number;
  limit?: number;
  type?: "material" | "service" | "both";
}

export class GlobalSearchService {
  private readonly baseUrl = "/api/v1/search";

  // Global search across materials and services
  async searchItems(params: GlobalSearchParams): Promise<GlobalSearchResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/items`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Quick search for autocomplete/suggestions
  async quickSearch(query: string, limit: number = 5): Promise<GlobalSearchResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/quick`, {
        params: { q: query, limit },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const globalSearchService = new GlobalSearchService();