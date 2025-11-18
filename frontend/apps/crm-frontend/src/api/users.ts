import axios from 'axios';
import { config, auth } from '../config';

export interface SalesUserOption {
  id: string; // user id
  name: string;
  email?: string;
}

// Axios instance for HR service
const hrApi = axios.create({
  baseURL: config.HR_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

hrApi.interceptors.request.use(cfg => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) ||
    localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  if (token) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as any).Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export const usersApi = {
  // Fetch employees and return only users with SALES roles
  async getSalesUsers(): Promise<SalesUserOption[]> {
    const res = await hrApi.get('/employees/list/all');
    const data = res?.data?.data ?? [];

    // Shape may be one-to-one (object) or one-to-many (array) for emp.users
    let options: SalesUserOption[] = (data as any[])
      .map(emp => {
        const usersRel = emp?.users;
        const userObj = Array.isArray(usersRel) ? usersRel[0] : usersRel; // pick first if array
        const roles: string[] = (userObj?.roles as string[]) || [];
        const isSales =
          Array.isArray(roles) &&
          (roles.includes('SALES') || roles.includes('SALES_MANAGER'));
        if (!isSales) return null;
        return {
          id: userObj?.id || emp?.id,
          name: emp?.full_name || userObj?.email || 'User',
          email: userObj?.email,
        } as SalesUserOption;
      })
      .filter(Boolean) as SalesUserOption[];

    // Fallback: if no sales roles found, show all employees so user can still assign
    if (options.length === 0) {
      options = (data as any[])
        .map(emp => {
          const usersRel = emp?.users;
          const userObj = Array.isArray(usersRel) ? usersRel[0] : usersRel;
          return {
            id: userObj?.id || emp?.id,
            name: emp?.full_name || userObj?.email || 'Employee',
            email: userObj?.email,
          } as SalesUserOption;
        })
        .filter(o => !!o.id);
    }

    // Sort by name asc
    options.sort((a, b) => a.name.localeCompare(b.name));
    return options;
  },

  // Fetch employees with PROJECT_ENGINEER role
  async getEngineeringUsers(): Promise<SalesUserOption[]> {
    const res = await hrApi.get('/employees/list/all');
    const data = res?.data?.data ?? [];

    let options: SalesUserOption[] = (data as any[])
      .map(emp => {
        const usersRel = emp?.users;
        const userObj = Array.isArray(usersRel) ? usersRel[0] : usersRel;
        const roles: string[] = (userObj?.roles as string[]) || [];
        const isPE = Array.isArray(roles) && roles.includes('PROJECT_ENGINEER');
        if (!isPE) return null;
        return {
          id: userObj?.id || emp?.id,
          name: emp?.full_name || userObj?.email || 'User',
          email: userObj?.email,
        } as SalesUserOption;
      })
      .filter(Boolean) as SalesUserOption[];

    // Fallback: if no PE roles found, show all employees
    if (options.length === 0) {
      options = (data as any[])
        .map(emp => {
          const usersRel = emp?.users;
          const userObj = Array.isArray(usersRel) ? usersRel[0] : usersRel;
          return {
            id: userObj?.id || emp?.id,
            name: emp?.full_name || userObj?.email || 'Employee',
            email: userObj?.email,
          } as SalesUserOption;
        })
        .filter(o => !!o.id);
    }

    options.sort((a, b) => a.name.localeCompare(b.name));
    return options;
  },
};

export default usersApi;
