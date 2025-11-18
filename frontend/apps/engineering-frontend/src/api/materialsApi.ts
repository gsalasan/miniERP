import axios from "axios";
import {
  Material,
  MaterialsQueryParams,
  MaterialsResponse,
  MaterialResponse,
  MaterialsStats,
  FilterOptions,
} from "../types/material";

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001";

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
    // Handle API errors silently or use proper error handling
    return Promise.reject(error);
  },
);

export class MaterialsService {
  private readonly baseUrl = "/api/v1/materials";

  // Get all materials with optional filters and pagination
  async getMaterials(params: MaterialsQueryParams = {}): Promise<MaterialsResponse> {
    try {
      const response = await apiClient.get(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch materials: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Get material by ID
  async getMaterialById(id: string): Promise<MaterialResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch material: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Create new material
  async createMaterial(
    material: Omit<Material, "id" | "created_at" | "updated_at">,
  ): Promise<MaterialResponse> {
    try {
      const response = await apiClient.post(this.baseUrl, material);
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to create material: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Update material
  async updateMaterial(id: string, material: Partial<Material>): Promise<MaterialResponse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, material);
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to update material: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Delete material
  async deleteMaterial(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to delete material: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Get materials statistics
  async getMaterialsStats(): Promise<MaterialsStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`);
      return response.data.data; // Backend wraps stats in { success, data }
    } catch (error) {
      throw new Error(
        `Failed to fetch materials stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Get filter options
  async getFilterOptions(): Promise<FilterOptions> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/filter-options`);
      // Backend sometimes wraps the result as { success, data } — normalize here
      const payload = response.data;
      return payload.data ?? payload;
    } catch (error) {
      throw new Error(
        `Failed to fetch filter options: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // FITUR 3.2.C: Create material with vendor and initial price
  async createMaterialWithVendor(data: {
    item_name: string;
    owner_pn?: string;
    category?: string;
    brand?: string;
    satuan: string;
    status?: string;
    location?: string;
    initialPrice: {
      vendor: string;
      price: number;
      currency: string;
      exchangeRate?: number;
      cost_validity?: string;
    };
  }): Promise<MaterialResponse> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/with-vendor`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        // Duplicate P/N error
        throw new Error(
          error.response.data.message || "Material dengan P/N ini sudah ada di database.",
        );
      }
      throw new Error(
        `Failed to create material: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // FITUR 3.2.C: Search materials for autocomplete
  async searchMaterials(query: string, limit: number = 20): Promise<Material[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/search`, {
        params: { q: query, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to search materials: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

// Create and export a singleton instance
export const materialsService = new MaterialsService();
