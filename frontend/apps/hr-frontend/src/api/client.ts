import axios from 'axios';
import API_CONFIG from '../config';

const hrClient = axios.create({
  baseURL: API_CONFIG.HR_API_BASE_URL,
  timeout: API_CONFIG.REQUEST_TIMEOUT_MS,
  withCredentials: true,
});

hrClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('[HR Client] Request to:', config.url, 'Token exists:', !!token);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('[HR Client] No token found in localStorage');
  }
  return config;
});

hrClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      API_CONFIG.OFFLINE_FALLBACK_MESSAGE;
    return Promise.reject(new Error(message));
  }
);

export default hrClient;