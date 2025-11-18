import axios from "axios";
import {
  Service,
  ServicesQueryParams,
  ServicesResponse,
  ServiceResponse,
  ServicesStatsResponse,
  ServiceFilterOptions,
} from "../types/service";
import { ServiceUnit } from "../types/enums";

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

export class ServicesService {
  private readonly baseUrl = "/api/v1/services";

  // Get all services with optional filters and pagination
  async getServices(params: ServicesQueryParams = {}): Promise<ServicesResponse> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data;
  }

  // Get a single service by ID
  async getService(id: string): Promise<ServiceResponse> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Create a new service
  async createService(
    serviceData: Omit<Service, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResponse> {
    const response = await apiClient.post(this.baseUrl, serviceData);
    return response.data;
  }

  // Update an existing service
  async updateService(
    id: string,
    serviceData: Partial<Omit<Service, "id" | "created_at" | "updated_at">>,
  ): Promise<ServiceResponse> {
    const response = await apiClient.put(`${this.baseUrl}/${id}`, serviceData);
    return response.data;
  }

  // Delete a service
  async deleteService(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Get services statistics
  async getServicesStats(): Promise<ServicesStatsResponse> {
    const response = await apiClient.get(`${this.baseUrl}/stats`);
    return response.data; // Backend returns { success, message, data }
  }

  // Get filter options (unique values for dropdowns)
  async getFilterOptions(): Promise<ServiceFilterOptions> {
    // TODO: Implement backend endpoint for filter options
    // For now, return mock filter options
    return {
      units: [ServiceUnit.Jam, ServiceUnit.Hari],
      item_types: ["Service"],
    };
  }

  // Export services data
  async exportServices(params: ServicesQueryParams = {}): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      params,
      responseType: "blob",
    });
    return response.data;
  }
}

// Export singleton instance
export const servicesService = new ServicesService();
