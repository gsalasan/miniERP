// API utilities and endpoints for Finance module
import { API_ENDPOINTS } from '../config';

// Types
export interface ChartOfAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateChartOfAccountDto {
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description?: string;
}

export interface UpdateChartOfAccountDto {
  account_code?: string;
  account_name?: string;
  account_type?: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Get authentication token from localStorage
const getAuthToken = (): string | null => {
  // For development, use a dummy token or return null to skip auth
  // TODO: Implement proper authentication flow
  return localStorage.getItem('token') || 'dummy-token-for-development';
};

// API Client class
class ChartOfAccountsAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_ENDPOINTS.CHART_OF_ACCOUNTS;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const url = `${this.baseUrl}${endpoint}`;
    console.log('🔍 API Request:', url, options.method || 'GET');
    console.log('🔍 Full URL will be:', window.location.origin + url);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
        mode: 'cors',
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      // Read as text first to debug
      const text = await response.text();
      console.log('📄 Response body (first 200 chars):', text.substring(0, 200));

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON Parse Error! Response was:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('❌ API request error:', error);
      throw error;
    }
  }

  // GET all chart of accounts
  async getAll(): Promise<ApiResponse<ChartOfAccount[]>> {
    return this.request<ChartOfAccount[]>('/chart-of-accounts', {
      method: 'GET',
    });
  }

  // GET chart of account by ID
  async getById(id: number): Promise<ApiResponse<ChartOfAccount>> {
    return this.request<ChartOfAccount>(`/chart-of-accounts/${id}`, {
      method: 'GET',
    });
  }

  // POST create new chart of account
  async create(data: CreateChartOfAccountDto): Promise<ApiResponse<ChartOfAccount>> {
    return this.request<ChartOfAccount>('/chart-of-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT update chart of account
  async update(id: number, data: UpdateChartOfAccountDto): Promise<ApiResponse<ChartOfAccount>> {
    return this.request<ChartOfAccount>(`/chart-of-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE chart of account
  async delete(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/chart-of-accounts/${id}`, {
      method: 'DELETE',
    });
  }
}

export const chartOfAccountsAPI = new ChartOfAccountsAPI();