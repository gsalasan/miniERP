import axios from "axios";
import { config, auth } from "../config";

const API_BASE_URL = config.CRM_SERVICE_URL;

export interface ChangeTOPRequest {
  new_top_days: number;
  effective_date?: string | null;
  reason: string;
  request_for_approval?: boolean;
}

export interface ApproveTOPRequest {
  approved: boolean;
  rejection_reason?: string;
}

export interface TOPHistoryItem {
  id: string;
  customer_id: string;
  old_top_days: number;
  new_top_days: number;
  changed_by: string;
  changed_at: string;
  effective_date?: string | null;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SCHEDULED";
  approved_by?: string | null;
  approved_at?: string | null;
  changed_by_user?: {
    id: string;
    email: string;
    employee?: {
      full_name: string;
    };
  };
  approved_by_user?: {
    id: string;
    email: string;
    employee?: {
      full_name: string;
    };
  };
}

/**
 * Change customer TOP (Terms of Payment)
 */
export const changeTOP = async (customerId: string, data: ChangeTOPRequest) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.post(
    `${API_BASE_URL}/customers/${customerId}/top`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data;
};

/**
 * Get TOP change history for a customer
 */
export const getTOPHistory = async (
  customerId: string,
  page: number = 1,
  limit: number = 10,
) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.get(
    `${API_BASE_URL}/customers/${customerId}/top-history`,
    {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data;
};

/**
 * Approve or reject a pending TOP change request
 */
export const approveTOPChange = async (
  historyId: string,
  data: ApproveTOPRequest,
) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.post(
    `${API_BASE_URL}/top-changes/${historyId}/approve`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data;
};

export const topApi = {
  changeTOP,
  getTOPHistory,
  approveTOPChange,
};
