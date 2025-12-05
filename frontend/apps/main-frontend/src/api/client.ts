import axios from 'axios';
import API_CONFIG from '../config';

const apiClient = axios.create({
  baseURL: API_CONFIG.HR_API_BASE_URL,
  withCredentials: true,
  timeout: API_CONFIG.REQUEST_TIMEOUT_MS,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      API_CONFIG.OFFLINE_FALLBACK_MESSAGE;
    return Promise.reject(new Error(message));
  }
);

export default apiClient;