import axios from 'axios';
import { Material, MaterialsQueryParams, MaterialsResponse, MaterialResponse, MaterialsStats, FilterOptions } from '../types/material';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});   

// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Sending request with token:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class MaterialsService {
  private readonly baseUrl = '/api/v1/materials';

  // Get all materials with optional filters and pagination
  async getMaterials(params: MaterialsQueryParams = {}): Promise<MaterialsResponse> {
    try {
      const response = await apiClient.get(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch materials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get material by ID
  async getMaterialById(id: string): Promise<MaterialResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create new material
  async createMaterial(material: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<MaterialResponse> {
    try {
      const response = await apiClient.post(this.baseUrl, material);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update material
  async updateMaterial(id: string, material: Partial<Material>): Promise<MaterialResponse> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, material);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete material
  async deleteMaterial(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete material: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get materials statistics
  async getMaterialsStats(): Promise<MaterialsStats> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`);
      return response.data.data; // Backend wraps stats in { success, data }
    } catch (error) {
      throw new Error(`Failed to fetch materials stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get filter options
  async getFilterOptions(): Promise<FilterOptions> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/filter-options`);
      return response.data; // Backend returns direct data, not wrapped
    } catch (error) {
      throw new Error(`Failed to fetch filter options: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create and export a singleton instance
export const materialsService = new MaterialsService();