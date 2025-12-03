import axios, { AxiosInstance } from 'axios';

const PROJECT_SERVICE_URL = import.meta.env.VITE_PROJECT_SERVICE_URL || 'http://localhost:4007';

class RfpService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${PROJECT_SERVICE_URL}/api/v1`,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async createRfp(projectId: string, payload: any) {
    const res = await this.api.post(`/projects/${projectId}/rfp`, payload);
    if (!res.data || !res.data.success) throw new Error(res.data?.message || 'Failed to create RFP');
    return res.data.data;
  }
}

export const rfpService = new RfpService();
