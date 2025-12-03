import axios from 'axios';
import {
  RFP,
  RFPListResponse,
  RFPQueryParams,
  CreatePOFromRFPPayload,
  PurchaseOrder,
} from '../types/rfp.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/procurement`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const rfpApi = {
  // Get RFP list with filters
  getRFPList: async (params?: RFPQueryParams): Promise<RFPListResponse> => {
    const response = await apiClient.get('/rfps', { params });
    return response.data;
  },

  // Get RFP detail by ID
  getRFPById: async (id: string): Promise<RFP> => {
    const response = await apiClient.get(`/rfps/${id}`);
    return response.data;
  },

  // Create Purchase Order from RFP
  createPOFromRFP: async (payload: CreatePOFromRFPPayload): Promise<PurchaseOrder> => {
    const response = await apiClient.post('/purchase-orders/from-rfp', payload);
    return response.data;
  },

  // Update RFP status (for internal use if needed)
  updateRFPStatus: async (id: string, status: string): Promise<RFP> => {
    const response = await apiClient.patch(`/rfps/${id}/status`, { status });
    return response.data;
  },
};
