// API helper for HR Service
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_HR_API_URL || 'http://localhost:3003/api/v1';

export const getToken = () => localStorage.getItem('token');

export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
