import axios from 'axios';

const IDENTITY_SERVICE_URL =
  import.meta.env.VITE_IDENTITY_SERVICE_URL || 'http://localhost:4000';

const identityClient = axios.create({
  baseURL: IDENTITY_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
identityClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User interface
export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
}

class IdentityService {
  private readonly meUrl = '/api/v1/auth/me';

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    const response = await identityClient.get(this.meUrl);
    return response.data?.data || response.data;
  }

  // Get users by role
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      const response = await identityClient.get('/api/v1/users', {
        params: { role },
      });
      const payload = response.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    } catch {
      return [];
    }
  }
}

export const identityService = new IdentityService();
export const identityApi = identityService;
