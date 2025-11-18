import axios from "axios";
import { API_BASE_URL } from "../config";
import {
  Estimation,
  EstimationItem,
  EstimationCalculationInput,
  EstimationCalculationResult,
  EstimationResponse,
  EstimationsResponse,
} from "../types/estimation";

// Base API configuration
// Gunakan config agar sinkron

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

export class EstimationsService {
  private readonly baseUrl = "/api/v1/estimations";

  // Get estimation queue
  async getEstimationQueue(): Promise<EstimationsResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/queue`);
      return { data: response.data, success: true };
    } catch (error) {
      throw new Error(
        `Failed to fetch estimation queue: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Assign estimation to user
  async assignEstimation(id: string, assigneeUserId: string): Promise<EstimationResponse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}/assign`, {
        assigneeUserId,
      });
      return { data: response.data, success: true };
    } catch (error) {
      throw new Error(
        `Failed to assign estimation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Start working on estimation
  async startEstimationWork(id: string): Promise<EstimationResponse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}/start`);
      return { data: response.data, success: true };
    } catch (error) {
      throw new Error(
        `Failed to start estimation work: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Get all estimations
  async getEstimations(): Promise<EstimationsResponse> {
    try {
      const response = await apiClient.get(this.baseUrl);
      return { data: response.data, success: true };
    } catch (error) {
      throw new Error(
        `Failed to fetch estimations: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Get estimation by ID
  async getEstimationById(id: string): Promise<EstimationResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      return { data: response.data, success: true };
    } catch (error) {
      throw new Error(
        `Failed to fetch estimation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Create new estimation
  async createEstimation(estimation: Partial<Estimation>): Promise<EstimationResponse> {
    try {
      const response = await apiClient.post(this.baseUrl, estimation);
      return { data: response.data, success: true };
    } catch (error) {
      throw new Error(
        `Failed to create estimation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // FITUR 3.1.D: Create estimation request from Sales (via CRM Service)
  async requestEstimation(data: {
    projectId: string;
    assignedToUserId?: string;
    technicalBrief: string;
    attachmentUrls?: Array<{ name: string; url: string }>;
    requestedByUserId?: string;
    salesPic?: string;
    customerName?: string;
  }): Promise<EstimationResponse> {
    try {
      // Call to CRM Service (port 4002) instead of Engineering Service
      const CRM_API_URL = import.meta.env.VITE_CRM_API_URL || "http://localhost:4002";
      const response = await axios.post(`${CRM_API_URL}/api/v1/estimations`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: apiClient.defaults.headers.Authorization || "",
        },
        timeout: 10000,
      });
      return { data: response.data, success: true };
    } catch (error) {
      throw new Error(
        `Failed to request estimation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Update estimation
  async updateEstimation(id: string, estimation: Partial<Estimation>): Promise<EstimationResponse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, estimation);
      return { data: response.data, success: true };
    } catch (error) {
      throw new Error(
        `Failed to update estimation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Delete estimation
  async deleteEstimation(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      throw new Error(
        `Failed to delete estimation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Calculate estimation
  async calculateEstimation(
    input: EstimationCalculationInput,
  ): Promise<EstimationCalculationResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/calculate`, input);
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to calculate estimation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // FITUR 3.2.B: Calculate modular estimation (with sections)
  async calculateModularEstimation(data: {
    sections: any[];
    overhead_percentage?: number;
    profit_margin_percentage?: number;
  }): Promise<any> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/calculate-modular`, data);
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to calculate modular estimation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // FITUR 3.2.B: Submit estimation for approval
  async submitEstimation(
    estimationId: string,
    data: {
      sections: any[];
      status?: "DRAFT" | "PENDING_APPROVAL";
    },
  ): Promise<EstimationResponse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${estimationId}/submit`, data);
      return { data: response.data, success: true };
    } catch (error) {
      throw new Error(
        `Failed to submit estimation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // FITUR 3.2.B: Save as draft
  async saveDraft(
    estimationId: string,
    data: {
      sections: any[];
    },
  ): Promise<EstimationResponse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${estimationId}/draft`, data);
      return { data: response.data, success: true };
    } catch (error) {
      throw new Error(
        `Failed to save draft: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export const estimationsService = new EstimationsService();
