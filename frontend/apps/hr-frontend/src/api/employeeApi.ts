// API helper for employee endpoints (sesuai backend HR-service)
const BASE_URL = 'http://localhost:3002/api/v1';

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
