import axios from 'axios';
import { ENDPOINTS } from '../config/environments';

const PROCUREMENT_BASE_URL = ENDPOINTS.PROCUREMENT;

const procurementApi = axios.create({ baseURL: PROCUREMENT_BASE_URL, headers: { 'Content-Type': 'application/json' } });

procurementApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const vendorLookupsApi = {
  getCategories: async () => {
    const res = await procurementApi.get('/vendor-categories');
    return res.data.data || res.data;
  },
  createCategory: async (payload: { value: string; label?: string }) => {
    const res = await procurementApi.post('/vendor-categories', payload);
    return res.data.data || res.data;
  },
  deleteCategory: async (value: string, opts?: { force?: boolean }) => {
    const q = opts?.force ? '?force=true' : '';
    const res = await procurementApi.delete(
      `/vendor-categories/${encodeURIComponent(value)}${q}`
    );
    return res.data;
  },
  getClassifications: async () => {
    const res = await procurementApi.get('/vendor-classifications');
    return res.data.data || res.data;
  },
  createClassification: async (payload: { value: string; label?: string }) => {
    const res = await procurementApi.post('/vendor-classifications', payload);
    return res.data.data || res.data;
  },
  deleteClassification: async (value: string, opts?: { force?: boolean }) => {
    const q = opts?.force ? '?force=true' : '';
    const res = await procurementApi.delete(`/vendor-classifications/${encodeURIComponent(value)}${q}`);
    return res.data;
  },
};
