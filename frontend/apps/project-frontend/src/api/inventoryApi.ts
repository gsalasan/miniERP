import axios, { AxiosInstance } from 'axios';
import type { ApiResponse } from '../types';

const INVENTORY_SERVICE_URL = import.meta.env.VITE_INVENTORY_SERVICE_URL || 'http://localhost:4005';

class InventoryApi {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({ baseURL: `${INVENTORY_SERVICE_URL}/api/v1`, headers: { 'Content-Type': 'application/json' } });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getBomMaterials(projectId: string) {
    const resp = await this.api.get<ApiResponse<any>>('/inventory/materials', { params: { projectId } });
    if (!resp.data || resp.data.success === false) throw new Error(resp.data?.message || 'Failed to fetch materials');
    // support data as array or data.data
    const data = resp.data.data || resp.data;
    return Array.isArray(data) ? data : [];
  }

  async allocate({ projectId, materialId, quantity, need, userId }: { projectId: string; materialId: string; quantity: number; need?: number; userId?: string }) {
    const payload: any = { projectId, materialId, quantity };
    if (need !== undefined) payload.need = need;
    if (userId) payload.userId = userId;
    const resp = await this.api.post<ApiResponse<any>>('/inventory/allocate', payload);
    if (!resp.data || resp.data.success === false) throw new Error(resp.data?.message || 'Allocation failed');
    return resp.data.data || resp.data;
  }
}

export const inventoryApi = new InventoryApi();
