import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api/v1/auth';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const crossAppToken = localStorage.getItem('cross_app_token');
  
  console.log('📦 Request to:', config.url);
  console.log('🔑 Token from localStorage:', token ? '✅ ' + token.substring(0, 20) + '...' : '❌ null');
  console.log('🔀 Cross-app token:', crossAppToken ? '✅ ' + crossAppToken.substring(0, 20) + '...' : '❌ null');
  
  if (token) {
    console.log('✅ Adding Authorization header with token');
    config.headers.Authorization = `Bearer ${token}`;
  } else if (crossAppToken) {
    console.log('⚡ Using cross_app_token instead');
    config.headers.Authorization = `Bearer ${crossAppToken}`;
  } else {
    console.warn('⚠️ No token found to add to request');
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  roles: string[];
  is_active: boolean;
  employee_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Get all users
export const fetchAllUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data.data || [];
};

// Get user by ID
export const fetchUserById = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
};

// Create user
export const createUser = async (data: { email: string; password: string; roles: string[] }): Promise<User> => {
  const response = await api.post('/register', data);
  return response.data.data;
};

// Update user
export const updateUser = async (id: string, data: Partial<{ email: string; roles: string[]; is_active: boolean }>): Promise<User> => {
  const response = await api.put(`/users/${id}`, data);
  return response.data.data;
};

// Delete user
export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export default api;
