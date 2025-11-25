import axios from "axios";
import { QuotationData } from "../types/quotation";

const API_BASE_URL = import.meta.env.VITE_CRM_SERVICE_URL || "http://localhost:4002";

interface QuotationResponse {
  success: boolean;
  data?: QuotationData;
  message?: string;
  error?: string;
}

/**
 * Get quotation data for a specific opportunity
 * @param opportunityId - The opportunity/project ID
 * @param token - JWT authentication token
 * @returns Promise with quotation data
 */
export const getQuotationData = async (
  opportunityId: string,
  token: string,
): Promise<QuotationData> => {
  try {
    const response = await axios.get<QuotationResponse>(
      `${API_BASE_URL}/api/v1/quotations/${opportunityId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || "Failed to fetch quotation data");
    }

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to get quotation: ${message}`);
    }
    throw error;
  }
};

export const quotationApi = {
  getQuotationData,
};
