const HR_API = 'http://localhost:4004/api/v1';

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
    const response = await fetch(`${HR_API}/approvals/check-subordinates/${employeeId}`);
    if (!response.ok) {
      throw new Error('Failed to check subordinates');
    }
    return await response.json();
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
    const response = await fetch(`${HR_API}/approvals/team/${managerId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch team requests');
    }
    return await response.json();
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
    const response = await fetch(`${HR_API}/approvals/all`);
    if (!response.ok) {
      throw new Error('Failed to fetch all requests');
    }
    return await response.json();
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
    const response = await fetch(`${HR_API}/approvals/${type}/approve/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approved_by: approvedBy }),
    });

    if (!response.ok) {
      throw new Error('Failed to approve request');
    }

    return await response.json();
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
    const response = await fetch(`${HR_API}/approvals/${type}/reject/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rejected_by: rejectedBy,
        rejection_reason: rejectionReason,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to reject request');
    }

    return await response.json();
  } catch (error) {
    console.error('Error rejecting request:', error);
    throw error;
  }
};
