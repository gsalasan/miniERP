import axios from 'axios';
import config, { endpoints } from '../config';

// Use CRM service URL (already includes /api/v1)
const BASE = config.CRM_SERVICE_URL || endpoints.BASE_URL || config.API_BASE_URL;

const client = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const dashboardApi = {
  async getSalesDashboard(params?: any) {
    const resp = await client.get(`/dashboards/sales`, { params });
    return resp.data;
  }
};
