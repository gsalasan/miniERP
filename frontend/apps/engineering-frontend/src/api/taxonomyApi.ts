import axios from "axios";

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
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
    return Promise.reject(error);
  },
);

export interface TaxonomyItem {
  id: string;
  name: string;
  text?: string; // For ServiceDescription which uses 'text' field
  created_at?: string;
  updated_at?: string;
}

export interface TaxonomyResponse {
  success: boolean;
  message: string;
  data: {
    data: TaxonomyItem[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export class TaxonomyService {
  private readonly baseUrl = "/api/v1/taxonomy";

  // System Categories
  async getSystemCategories(search?: string): Promise<TaxonomyItem[]> {
    const response = await apiClient.get<TaxonomyResponse>(`${this.baseUrl}/system-categories`, {
      params: { search, limit: 100 },
    });
    return response.data.data.data;
  }

  async createSystemCategory(name: string): Promise<TaxonomyItem> {
    const response = await apiClient.post(`${this.baseUrl}/system-categories`, { name });
    return response.data.data;
  }

  // Sub Systems
  async getSubSystems(systemCategoryId?: string, search?: string): Promise<TaxonomyItem[]> {
    const response = await apiClient.get<TaxonomyResponse>(`${this.baseUrl}/sub-systems`, {
      params: { system_category_id: systemCategoryId, search, limit: 100 },
    });
    return response.data.data.data;
  }

  async createSubSystem(name: string, system_category_id: string): Promise<TaxonomyItem> {
    const response = await apiClient.post(`${this.baseUrl}/sub-systems`, { name, system_category_id });
    return response.data.data;
  }

  // Service Categories (Kategori Jasa)
  async getServiceCategories(search?: string): Promise<TaxonomyItem[]> {
    const response = await apiClient.get<TaxonomyResponse>(`${this.baseUrl}/service-categories`, {
      params: { search, limit: 100 },
    });
    return response.data.data.data;
  }

  async createServiceCategory(name: string): Promise<TaxonomyItem> {
    const response = await apiClient.post(`${this.baseUrl}/service-categories`, { name });
    return response.data.data;
  }

  // Specific Types (Jenis Jasa Spesifik)
  async getSpecificTypes(categoryId?: string, search?: string): Promise<TaxonomyItem[]> {
    const response = await apiClient.get<TaxonomyResponse>(`${this.baseUrl}/specific-types`, {
      params: { category_id: categoryId, search, limit: 100 },
    });
    return response.data.data.data;
  }

  async createSpecificType(name: string, category_id: string): Promise<TaxonomyItem> {
    const response = await apiClient.post(`${this.baseUrl}/specific-types`, { name, category_id });
    return response.data.data;
  }

  // Descriptions (Deskripsi)
  async getDescriptions(search?: string): Promise<TaxonomyItem[]> {
    const response = await apiClient.get<TaxonomyResponse>(`${this.baseUrl}/descriptions`, {
      params: { search, limit: 500 },
    });
    return response.data.data.data;
  }

  async createDescription(text: string): Promise<TaxonomyItem> {
    const response = await apiClient.post(`${this.baseUrl}/descriptions`, { text });
    return response.data.data;
  }

  // Team Recommendations (Rekomendasi Tim)
  async getTeamRecommendations(search?: string): Promise<TaxonomyItem[]> {
    const response = await apiClient.get<TaxonomyResponse>(`${this.baseUrl}/team-recommendations`, {
      params: { search, limit: 1000 },
    });
    return response.data.data.data;
  }

  async createTeamRecommendation(name: string): Promise<TaxonomyItem> {
    const response = await apiClient.post(`${this.baseUrl}/team-recommendations`, { name });
    return response.data.data;
  }

  // Fase Proyek
  async getFaseProyeks(search?: string): Promise<TaxonomyItem[]> {
    const response = await apiClient.get<TaxonomyResponse>(`${this.baseUrl}/fase-proyeks`, {
      params: { search, limit: 100 },
    });
    return response.data.data.data;
  }

  async createFaseProyek(name: string): Promise<TaxonomyItem> {
    const response = await apiClient.post(`${this.baseUrl}/fase-proyeks`, { name });
    return response.data.data;
  }

  // SBU
  async getSBUs(search?: string): Promise<TaxonomyItem[]> {
    const response = await apiClient.get<TaxonomyResponse>(`${this.baseUrl}/sbus`, {
      params: { search, limit: 100 },
    });
    return response.data.data.data;
  }

  async createSBU(name: string): Promise<TaxonomyItem> {
    const response = await apiClient.post(`${this.baseUrl}/sbus`, { name });
    return response.data.data;
  }
}

// Export singleton instance
export const taxonomyService = new TaxonomyService();
