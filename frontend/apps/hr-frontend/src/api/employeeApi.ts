// API helper for employee endpoints (sesuai backend HR-service)
const BASE_URL = 'http://localhost:4004/api/v1';

export async function fetchEmployees() {
  const res = await fetch(`${BASE_URL}/employees`);
  const data = await res.json();
  return data.data || [];
}

export async function fetchEmployeeById(id: string | number) {
  const res = await fetch(`${BASE_URL}/employees/${id}`);
  const data = await res.json();
  return data.data || null;
}

export async function createEmployee({ employee, user, email }: any) {
  const res = await fetch(`${BASE_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee, user, email }),
  });
  return res.ok;
}

export async function updateEmployee(id: string | number, employee: any) {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  return res.ok;
}

export async function updateEmployeeUser(id: string | number, user: any) {
  const res = await fetch(`${BASE_URL}/employees/${id}/user`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return res.ok;
}

export async function deleteEmployee(id: string | number) {
  const res = await fetch(`${BASE_URL}/employees/${id}`, {
    method: 'DELETE',
  });
  return res.ok;
}

// Fetch modules allowed for a specific role from HR-service (backend should expose this)
export async function fetchModulesByRole(role: string) {
  try {
    const res = await fetch(`${BASE_URL}/roles/${encodeURIComponent(role)}/modules`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.modules || [];
  } catch (e) {
    // swallow and return empty list on error — caller can handle empty as no-access
    return [];
  }
}

// Fetch modules for multiple roles and deduplicate by id
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
