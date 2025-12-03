import axios from 'axios';
import config from '../config';

const BASE = config.CRM_SERVICE_URL || (import.meta.env.VITE_API_URL || 'http://localhost:4002');

const client = axios.create({ baseURL: BASE, headers: { 'Content-Type': 'application/json' } });
client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const incentiveApi = {
  async simulate(payload: { userId?: string; additionalSalesAmount: number }) {
    const resp = await client.post(`/sales/incentives/simulate`, payload);
    return resp.data;
  },
};

export default incentiveApi;
