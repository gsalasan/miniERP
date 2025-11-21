// Production authentication service
// Menggunakan real login API untuk authentication

import axios from 'axios';

const AUTH_BASE_URL = 'http://localhost:4000/api/v1/auth';

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: {
    id: string;
    email: string;
    roles: string[];
  };
}

interface UserData {
  id: string;
  email: string;
  roles: string[];
}

export class AuthService {
  // Login user dengan email dan password
  static async login(email: string, password: string): Promise<{ token: string; user: UserData }> {
    try {
      const response = await axios.post<LoginResponse>(`${AUTH_BASE_URL}/login`, {
        email,
        password,
      });

      if (response.data.success && response.data.token) {
        // Simpan token ke localStorage
        localStorage.setItem('authToken', response.data.token);

        return {
          token: response.data.token,
          user: response.data.data!,
        };
      } else {
        throw new Error(response.data.message || 'Login gagal');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Gagal terhubung ke server authentication');
    }
  }

  // Logout user
  static logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token'); // legacy
  }

  // Get token dari localStorage
  static getToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }

  // Check apakah user sudah login
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  // Get user data dari token
  static getCurrentUser(): UserData | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        email: payload.email,
        roles: payload.roles || [],
      };
    } catch {
      return null;
    }
  }

  // Check apakah user memiliki role tertentu
  static hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles.includes(role) || false;
  }

  // Verify token dengan server
  static async verifyToken(): Promise<UserData | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await axios.get(`${AUTH_BASE_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        this.logout();
        return null;
      }
    } catch {
      this.logout();
      return null;
    }
  }
}

// Export untuk backward compatibility
export const setMockAuthToken = () => {
  console.warn('setMockAuthToken is deprecated. Use AuthService.login() instead.');
};

export const removeMockAuthToken = () => {
  AuthService.logout();
};

export const getMockAuthToken = () => {
  return AuthService.getToken();
};
