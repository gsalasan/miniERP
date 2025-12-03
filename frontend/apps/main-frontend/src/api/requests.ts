import axios from 'axios';

const HR_SERVICE_URL = 'http://localhost:4004/api/v1';

// Get token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth header
const hrApi = axios.create({
  baseURL: HR_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
hrApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== Permission Requests ====================
export interface PermissionRequest {
  id: string;
  employee_id: string;
  permission_type: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    full_name: string;
    position: string;
    department?: string;
  };
}

export const createPermissionRequest = async (data: {
  permission_type: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  reason: string;
}) => {
  const response = await hrApi.post<{ success: boolean; data: PermissionRequest }>('/permissions', data);
  return response.data.data;
};

export const getMyPermissions = async (status?: string) => {
  const response = await hrApi.get<{ success: boolean; data: PermissionRequest[] }>('/permissions/my', {
    params: status ? { status } : {},
  });
  return response.data.data;
};

export const getAllPermissions = async (filters?: { status?: string; page?: number; limit?: number }) => {
  const response = await hrApi.get<{
    success: boolean;
    data: PermissionRequest[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/permissions', { params: filters });
  return response.data;
};

export const updatePermissionStatus = async (id: string, status: 'APPROVED' | 'REJECTED', rejection_reason?: string) => {
  const response = await hrApi.put<{ success: boolean; data: PermissionRequest }>(`/permissions/${id}/status`, {
    status,
    rejection_reason,
  });
  return response.data.data;
};

export const cancelPermission = async (id: string) => {
  const response = await hrApi.post<{ success: boolean; data: PermissionRequest }>(`/permissions/${id}/cancel`);
  return response.data.data;
};

// ==================== Overtime Requests ====================
export interface OvertimeRequest {
  id: string;
  employee_id: string;
  overtime_code: 'L1' | 'L2' | 'L3' | 'L4';
  overtime_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    full_name: string;
    position: string;
    department?: string;
  };
}

export const createOvertimeRequest = async (data: {
  overtime_code: 'L1' | 'L2' | 'L3' | 'L4';
  overtime_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  description: string;
}) => {
  const response = await hrApi.post<{ success: boolean; data: OvertimeRequest }>('/overtimes', data);
  return response.data.data;
};

export const getMyOvertimes = async (status?: string) => {
  const response = await hrApi.get<{ success: boolean; data: OvertimeRequest[] }>('/overtimes/my', {
    params: status ? { status } : {},
  });
  return response.data.data;
};

export const getAllOvertimes = async (filters?: { status?: string; page?: number; limit?: number }) => {
  const response = await hrApi.get<{
    success: boolean;
    data: OvertimeRequest[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/overtimes', { params: filters });
  return response.data;
};

export const updateOvertimeStatus = async (id: string, status: 'APPROVED' | 'REJECTED', rejection_reason?: string) => {
  const response = await hrApi.put<{ success: boolean; data: OvertimeRequest }>(`/overtimes/${id}/status`, {
    status,
    rejection_reason,
  });
  return response.data.data;
};

export const cancelOvertime = async (id: string) => {
  const response = await hrApi.post<{ success: boolean; data: OvertimeRequest }>(`/overtimes/${id}/cancel`);
  return response.data.data;
};

// ==================== Reimbursement Requests ====================
export interface ReimbursementRequest {
  id: string;
  employee_id: string;
  reimbursement_type: string;
  claim_date: string;
  amount: number;
  currency: string;
  description: string;
  receipt_file?: string;
  receipt_url?: string; // Add this for backward compatibility
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    full_name: string;
    position: string;
    department?: string;
  };
}

export const createReimbursementRequest = async (data: {
  reimbursement_type: string;
  claim_date: string;
  amount: number;
  currency?: string;
  description: string;
  receipt_file?: string;
}) => {
  const response = await hrApi.post<{ success: boolean; data: ReimbursementRequest }>('/reimbursements', data);
  return response.data.data;
};

export const getMyReimbursements = async (status?: string) => {
  const response = await hrApi.get<{ success: boolean; data: ReimbursementRequest[] }>('/reimbursements/my', {
    params: status ? { status } : {},
  });
  return response.data.data;
};

export const getAllReimbursements = async (filters?: { status?: string; page?: number; limit?: number }) => {
  const response = await hrApi.get<{
    success: boolean;
    data: ReimbursementRequest[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/reimbursements', { params: filters });
  return response.data;
};

export const updateReimbursementStatus = async (id: string, status: 'APPROVED' | 'REJECTED', rejection_reason?: string) => {
  const response = await hrApi.put<{ success: boolean; data: ReimbursementRequest }>(`/reimbursements/${id}/status`, {
    status,
    rejection_reason,
  });
  return response.data.data;
};

export const markReimbursementPaid = async (id: string) => {
  const response = await hrApi.post<{ success: boolean; data: ReimbursementRequest }>(`/reimbursements/${id}/paid`);
  return response.data.data;
};

export const cancelReimbursement = async (id: string) => {
  const response = await hrApi.post<{ success: boolean; data: ReimbursementRequest }>(`/reimbursements/${id}/cancel`);
  return response.data.data;
};

// ==================== Leave Requests ====================
export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'EMERGENCY' | 'UNPAID';
  start_date: string;
  end_date: string;
  duration_days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    full_name: string;
    position: string;
    department?: string;
  };
}

export const createLeaveRequest = async (data: {
  leave_type: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  reason: string;
}) => {
  const response = await hrApi.post<{ success: boolean; data: LeaveRequest }>('/leaves', data);
  return response.data.data;
};

export const getMyLeaves = async (status?: string) => {
  const response = await hrApi.get<{ success: boolean; data: LeaveRequest[] }>('/leaves/my', {
    params: status ? { status } : {},
  });
  return response.data.data;
};

export const getAllLeaves = async (filters?: { status?: string; page?: number; limit?: number }) => {
  const response = await hrApi.get<{
    success: boolean;
    data: LeaveRequest[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/leaves', { params: filters });
  return response.data;
};

export const updateLeaveStatus = async (id: string, status: 'APPROVED' | 'REJECTED', rejection_reason?: string) => {
  const response = await hrApi.put<{ success: boolean; data: LeaveRequest }>(`/leaves/${id}/status`, {
    status,
    rejection_reason,
  });
  return response.data.data;
};

export const cancelLeave = async (id: string) => {
  const response = await hrApi.post<{ success: boolean; data: LeaveRequest }>(`/leaves/${id}/cancel`);
  return response.data.data;
};
