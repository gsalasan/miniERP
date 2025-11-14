import axios from 'axios';
import { config, auth } from '../config';

export interface SalesUser {
  id: string;
  name: string;
  email?: string;
}

// Axios instance for HR service
const hrApi = axios.create({
  baseURL: config.HR_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach token if present
hrApi.interceptors.request.use(cfg => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) ||
    localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  if (token) {
    (cfg.headers as any).Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export const hrService = {
  // Get active users with SALES-related roles and map to dropdown options
  async getSalesUsers(): Promise<SalesUser[]> {
    try {
      const res = await hrApi.get('/employees/list/all');
      const employees = res?.data?.data ?? res?.data ?? [];

      if (!Array.isArray(employees)) return [];

      const salesLike = employees
        .filter((emp: any) => {
          const u = emp?.users;
          const roles: string[] = Array.isArray(u?.roles) ? u.roles : [];
          const isSales =
            roles.includes('SALES') || roles.includes('SALES_MANAGER');
          return (
            Boolean(u?.id) &&
            Boolean(emp?.full_name) &&
            isSales &&
            (u?.is_active ?? true)
          );
        })
        .map((emp: any) => ({
          id: String(emp.users.id),
          name: String(emp.full_name),
          email: emp.users.email as string | undefined,
        }));

      // Deduplicate by id just in case
      const seen = new Set<string>();
      const unique = salesLike.filter((u: SalesUser) => {
        if (seen.has(u.id)) return false;
        seen.add(u.id);
        return true;
      });

      return unique;
    } catch (e) {
      // Fail soft – return empty list so UI still works
      return [];
    }
  },
};

export default hrService;
