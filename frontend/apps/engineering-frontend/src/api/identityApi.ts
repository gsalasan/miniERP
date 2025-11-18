import axios, { AxiosRequestHeaders } from "axios";

interface ImportMetaEnvLite {
  VITE_IDENTITY_API_URL?: string;
}

const metaEnvWrapper = (import.meta as unknown as { env?: ImportMetaEnvLite }) || {};
const metaEnv: ImportMetaEnvLite = metaEnvWrapper.env || {};
const IDENTITY_API_URL = metaEnv.VITE_IDENTITY_API_URL || "http://localhost:4000";

const identityClient = axios.create({
  baseURL: IDENTITY_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
identityClient.interceptors.request.use((config) => {
  let token = localStorage.getItem("token") || localStorage.getItem("authToken");
  if (!token) {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("token");
      if (t) {
        localStorage.setItem("token", t);
        token = t;
        // token loaded from URL
        // remove token from URL
        params.delete("token");
        const newSearch = params.toString();
        const newUrl =
          window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch {
      // ignore
    }
  }
  if (token) {
    const headers: AxiosRequestHeaders = (config.headers as AxiosRequestHeaders) || {};
    headers.Authorization = `Bearer ${token}`;
    config.headers = headers;
    // Authorization header ditambahkan
  } else {
    // NO TOKEN FOUND
  }
  return config;
});

// User profile interface
export interface UserProfile {
  id?: string;
  username?: string;
  email?: string;
  employee?: {
    id?: string;
    employee_id?: string;
    full_name?: string;
    phone?: string;
    position?: string;
    department?: string;
  };
}

class IdentityService {
  // Identity service exposes current user under auth routes
  private readonly meUrl = "/api/v1/auth/me";
  private readonly loginUrl = "/api/v1/auth/login";
  private readonly usersUrl = "/api/v1/users";

  // Login user
  async login(email: string, password: string) {
    return await identityClient.post(this.loginUrl, { email, password });
  }

  // Get current user profile
  async getCurrentUser(): Promise<UserProfile> {
    const response = await identityClient.get(this.meUrl);
    // Some services return { data }, others return raw object
    return (response.data && (response.data.data || response.data)) as UserProfile;
  }

  // Get users by role (e.g., role=PE)
  async getUsersByRole(role: string): Promise<UserProfile[]> {
    try {
      const response = await identityClient.get(this.usersUrl, { params: { role } });
      const payload = response.data;
      if (Array.isArray(payload)) return payload as UserProfile[];
      if (Array.isArray(payload?.data)) return payload.data as UserProfile[];
      return [];
    } catch {
      // Jika 404 / error: kembalikan array kosong untuk fallback
      return [];
    }
  }
}

export const identityService = new IdentityService();
export const identityApi = identityService;
