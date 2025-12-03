import axios from 'axios';
import { ENDPOINTS } from '../config/environments';
import {
  RFP,
  RFPListQuery,
  RFPListResponse,
  CreatePOFromRFPRequest,
  CreatePOFromRFPResponse,
} from '../types/rfp';

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

export const rfpApi = {
  /**
   * Get all RFPs with filters and pagination
   */
  async getAllRFPs(query?: RFPListQuery): Promise<RFPListResponse> {
    const params = new URLSearchParams();
    if (query?.status) params.append('status', query.status);
    if (query?.project_id) params.append('project_id', query.project_id);
    if (query?.requester_id) params.append('requester_id', query.requester_id);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sort_by) params.append('sort_by', query.sort_by);
    if (query?.sort_order) params.append('sort_order', query.sort_order);

    const response = await procurementApi.get(`/rfp?${params.toString()}`);
    return response.data;
  },

  /**
   * Get RFP by ID with full details
   */
  async getRFPById(id: string): Promise<RFP> {
    const response = await procurementApi.get(`/rfp/${id}`);
    return response.data.data;
  },

  /**
   * Create PO from RFP
   */
  async createPOFromRFP(
    rfpId: string,
    data: CreatePOFromRFPRequest
  ): Promise<CreatePOFromRFPResponse> {
    const response = await procurementApi.post(`/rfp/${rfpId}/create-po`, data);
    return response.data;
  },
};
