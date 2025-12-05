import apiClient from './client';

export interface ApprovalResponse {
  leave_requests: any[];
  permission_requests: any[];
  overtime_requests: any[];
  reimbursement_requests: any[];
  total: number;
}

export interface SubordinateCheckResponse {
  has_subordinates: boolean;
  count: number;
}

/**
 * Check if user has subordinates (is a manager)
 */
export const checkSubordinates = async (employeeId: string): Promise<SubordinateCheckResponse> => {
  try {
    const response = await apiClient.get<
      { success?: boolean; data?: SubordinateCheckResponse } & SubordinateCheckResponse
    >(`/approvals/check-subordinates/${employeeId}`);
    return response.data.data || {
      has_subordinates: response.data.has_subordinates ?? false,
      count: response.data.count ?? 0,
    };
  } catch (error) {
    console.error('Error checking subordinates:', error);
    return { has_subordinates: false, count: 0 };
  }
};

/**
 * Get team requests (for manager)
 * Returns requests from direct reports only
 */
export const getTeamRequests = async (managerId: string): Promise<ApprovalResponse> => {
  try {
    const response = await apiClient.get<{ success?: boolean; data?: ApprovalResponse } & ApprovalResponse>(
      `/approvals/team/${managerId}`
    );
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching team requests:', error);
    throw error;
  }
};

/**
 * Get all requests (for HR Admin)
 * Returns all pending requests company-wide
 */
export const getAllApprovalRequests = async (): Promise<ApprovalResponse> => {
  try {
    const response = await apiClient.get<{ success?: boolean; data?: ApprovalResponse } & ApprovalResponse>(
      '/approvals/all'
    );
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching all requests:', error);
    throw error;
  }
};

/**
 * Approve a request
 * @param type - 'leave' | 'permission' | 'overtime' | 'reimbursement'
 */
export const approveRequest = async (
  type: 'leave' | 'permission' | 'overtime' | 'reimbursement',
  requestId: string,
  approvedBy: string
) => {
  try {
    const response = await apiClient.put(`/approvals/${type}/approve/${requestId}`, {
      approved_by: approvedBy,
    });

    return response.data;
  } catch (error) {
    console.error('Error approving request:', error);
    throw error;
  }
};

/**
 * Reject a request
 * @param type - 'leave' | 'permission' | 'overtime' | 'reimbursement'
 */
export const rejectRequest = async (
  type: 'leave' | 'permission' | 'overtime' | 'reimbursement',
  requestId: string,
  rejectedBy: string,
  rejectionReason: string
) => {
  try {
    const response = await apiClient.put(`/approvals/${type}/reject/${requestId}`, {
      rejected_by: rejectedBy,
      rejection_reason: rejectionReason,
    });

    return response.data;
  } catch (error) {
    console.error('Error rejecting request:', error);
    throw error;
  }
};
