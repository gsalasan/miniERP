import axios from 'axios';
import { ENDPOINTS } from '../config/environments';

const PROCUREMENT_BASE_URL = ENDPOINTS.PROCUREMENT;

const procurementApi = axios.create({
  baseURL: PROCUREMENT_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

procurementApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

procurementApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export const poApi = {
  async getAllPOs(query?: any) {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.rfp_id) params.append('rfp_id', query.rfp_id);
    if (query?.vendor_id) params.append('vendor_id', query.vendor_id);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sort_by) params.append('sort_by', query.sort_by);
    if (query?.sort_order) params.append('sort_order', query.sort_order);

    const response = await procurementApi.get(`/po?${params.toString()}`);
    return response.data; // { data: [...], pagination: { ... } }
  },

  async getPOById(id: string) {
    const response = await procurementApi.get(`/po/${id}`);
    return response.data.data || response.data;
  },

  async updatePOStatus(id: string, status: string) {
    const response = await procurementApi.patch(`/po/${id}/status`, { status });
    return response.data;
  },

  async submitForApproval(poId: string, userId: string) {
    const response = await procurementApi.post(`/po/${poId}/submit-for-approval`, {
      user_id: userId,
    });
    return response.data;
  },

  async approvePO(poId: string, approverId: string, comments?: string) {
    const response = await procurementApi.post(`/po/${poId}/approve`, {
      approver_id: approverId,
      comments,
    });
    return response.data;
  },

  async rejectPO(poId: string, rejecterId: string, comments: string) {
    const response = await procurementApi.post(`/po/${poId}/reject`, {
      rejecter_id: rejecterId,
      comments,
    });
    return response.data;
  },

  // Download PO PDF
  async downloadPOPDF(poId: string): Promise<Blob> {
    const response = await procurementApi.get(`/po/${poId}/generate-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async getPendingApprovals(userId: string) {
    const response = await procurementApi.get(`/po/pending-approvals?user_id=${userId}`);
    return response.data.data || response.data;
  },

  async getApprovalThresholds() {
    const response = await procurementApi.get(`/po/approval-thresholds`);
    return response.data.data || response.data;
  },
};
