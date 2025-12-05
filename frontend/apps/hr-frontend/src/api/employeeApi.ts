import hrClient from './client';

export async function fetchEmployees() {
  const response = await hrClient.get<{ success?: boolean; data?: any[] }>('/employees');
  return response.data.data || response.data || [];
}

export async function fetchEmployeeById(id: string | number) {
  const response = await hrClient.get<{ success?: boolean; data?: any }>(`/employees/${id}`);
  return response.data.data || response.data || null;
}

export async function createEmployee({ employee, user, email }: any) {
  const response = await hrClient.post('/employees', { employee, user, email });
  return response.status < 400;
}

export async function updateEmployee(id: string | number, employee: any) {
  const response = await hrClient.put(`/employees/${id}`, employee);
  return response.status < 400;
}

export async function updateEmployeeUser(id: string | number, user: any) {
  const response = await hrClient.put(`/employees/${id}/user`, user);
  return response.status < 400;
}

export async function deleteEmployee(id: string | number) {
  const response = await hrClient.delete(`/employees/${id}`);
  return response.status < 400;
}

export async function fetchModulesByRole(role: string) {
  try {
    const response = await hrClient.get<{ modules?: any[] }>(`/roles/${encodeURIComponent(role)}/modules`);
    return response.data.modules || [];
  } catch (e) {
    return [];
  }
}

export async function fetchModulesByRoles(roles: string[]) {
  if (!roles || roles.length === 0) return [];
  const results = await Promise.all(roles.map((r) => fetchModulesByRole(r)));
  const all = results.flat();
  const map = new Map();
  for (const m of all) {
    if (!m || !m.id) continue;
    if (!map.has(m.id)) map.set(m.id, m);
  }
  return Array.from(map.values());
}
