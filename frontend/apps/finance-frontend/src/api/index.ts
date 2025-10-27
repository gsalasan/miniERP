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

// Journal Entry Types
export interface JournalEntry {
  id: string;
  transaction_date: string;
  description?: string | null;
  account_id: number;
  debit?: string | number | null;
  credit?: string | number | null;
  reference_id?: string | null;
  reference_type?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  account?: ChartOfAccount;
}

export interface CreateJournalEntryDto {
  transaction_date: string;
  description?: string;
  account_id: number;
  debit?: number;
  credit?: number;
  reference_id?: string;
  reference_type?: string;
  created_by?: string;
}

export interface UpdateJournalEntryDto {
  transaction_date?: string;
  description?: string;
  account_id?: number;
  debit?: number;
  credit?: number;
  reference_id?: string;
  reference_type?: string;
}

// Tax Rates Types
export interface TaxRate {
  id: number;
  tax_name: string;
  tax_code: string;
  rate: string | number;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaxRateDto {
  tax_name: string;
  tax_code: string;
  rate: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdateTaxRateDto {
  tax_name?: string;
  tax_code?: string;
  rate?: number;
  description?: string;
  is_active?: boolean;
}

// Exchange Rates Types
export interface ExchangeRate {
  id: number;
  currency_from: string;
  currency_to: string;
  rate: string | number;
  effective_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateExchangeRateDto {
  currency_from: string;
  currency_to: string;
  rate: number;
  effective_date: string;
  is_active?: boolean;
}

export interface UpdateExchangeRateDto {
  currency_from?: string;
  currency_to?: string;
  rate?: number;
  effective_date?: string;
  is_active?: boolean;
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

// Tax Rates API
class TaxRatesAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_ENDPOINTS.CHART_OF_ACCOUNTS; // Same base, just different endpoints
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
    console.log('🔍 Tax Rates API Request:', {
      url,
      method: options.method || 'GET',
      body: options.body,
      headers
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
        mode: 'cors',
      });

      console.log('📡 Tax Rates Response status:', response.status, response.statusText);
      
      // Read as text first to debug
      const text = await response.text();
      console.log('📄 Tax Rates Response body:', text.substring(0, 300));

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON Parse Error! Response was:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Tax Rates API request error:', error);
      throw error;
    }
  }

  async getAll(): Promise<ApiResponse<TaxRate[]>> {
    return this.request<TaxRate[]>('/tax-rates', { method: 'GET' });
  }

  async getById(id: number): Promise<ApiResponse<TaxRate>> {
    return this.request<TaxRate>(`/tax-rates/${id}`, { method: 'GET' });
  }

  async create(data: CreateTaxRateDto): Promise<ApiResponse<TaxRate>> {
    return this.request<TaxRate>('/tax-rates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: number, data: UpdateTaxRateDto): Promise<ApiResponse<TaxRate>> {
    return this.request<TaxRate>(`/tax-rates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/tax-rates/${id}`, { method: 'DELETE' });
  }
}

// Exchange Rates API
class ExchangeRatesAPI {
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
    console.log('🔍 Exchange Rates API Request:', {
      url,
      method: options.method || 'GET',
      body: options.body,
      headers
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
        mode: 'cors',
      });

      console.log('📡 Exchange Rates Response status:', response.status, response.statusText);
      
      // Read as text first to debug
      const text = await response.text();
      console.log('📄 Exchange Rates Response body:', text.substring(0, 300));

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON Parse Error! Response was:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Exchange Rates API request error:', error);
      throw error;
    }
  }

  async getAll(params?: { currency_from?: string; currency_to?: string; is_active?: boolean }): Promise<ApiResponse<ExchangeRate[]>> {
    const queryParams = new URLSearchParams();
    if (params?.currency_from) queryParams.append('currency_from', params.currency_from);
    if (params?.currency_to) queryParams.append('currency_to', params.currency_to);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/exchange-rates?${queryString}` : '/exchange-rates';
    
    return this.request<ExchangeRate[]>(endpoint, { method: 'GET' });
  }

  async getLatest(currency_from: string, currency_to: string): Promise<ApiResponse<ExchangeRate>> {
    return this.request<ExchangeRate>(
      `/exchange-rates/latest?currency_from=${currency_from}&currency_to=${currency_to}`,
      { method: 'GET' }
    );
  }

  async getById(id: number): Promise<ApiResponse<ExchangeRate>> {
    return this.request<ExchangeRate>(`/exchange-rates/${id}`, { method: 'GET' });
  }

  async create(data: CreateExchangeRateDto): Promise<ApiResponse<ExchangeRate>> {
    return this.request<ExchangeRate>('/exchange-rates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: number, data: UpdateExchangeRateDto): Promise<ApiResponse<ExchangeRate>> {
    return this.request<ExchangeRate>(`/exchange-rates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/exchange-rates/${id}`, { method: 'DELETE' });
  }
}

export const chartOfAccountsAPI = new ChartOfAccountsAPI();
export const taxRatesAPI = new TaxRatesAPI();
export const exchangeRatesAPI = new ExchangeRatesAPI();

// Journal Entries API
class JournalEntriesAPI {
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
    console.log('🔍 Journal Entries API Request:', {
      url,
      method: options.method || 'GET',
      body: options.body,
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-store',
        mode: 'cors',
      });

      console.log('📡 Journal Entries Response status:', response.status, response.statusText);
      
      const text = await response.text();
      console.log('📄 Journal Entries Response body:', text.substring(0, 300));

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ JSON Parse Error! Response was:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Journal Entries API request error:', error);
      throw error;
    }
  }

  async getAll(params?: { account_id?: number; start_date?: string; end_date?: string }): Promise<ApiResponse<JournalEntry[]>> {
    const queryParams = new URLSearchParams();
    if (params?.account_id) queryParams.append('account_id', params.account_id.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/journal-entries?${queryString}` : '/journal-entries';
    
    return this.request<JournalEntry[]>(endpoint, { method: 'GET' });
  }

  async getByAccountId(accountId: number): Promise<ApiResponse<JournalEntry[]>> {
    return this.request<JournalEntry[]>(`/journal-entries/account/${accountId}`, { method: 'GET' });
  }

  async getById(id: string): Promise<ApiResponse<JournalEntry>> {
    return this.request<JournalEntry>(`/journal-entries/${id}`, { method: 'GET' });
  }

  async create(data: CreateJournalEntryDto): Promise<ApiResponse<JournalEntry>> {
    return this.request<JournalEntry>('/journal-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: UpdateJournalEntryDto): Promise<ApiResponse<JournalEntry>> {
    return this.request<JournalEntry>(`/journal-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/journal-entries/${id}`, { method: 'DELETE' });
  }
}

export const journalEntriesAPI = new JournalEntriesAPI();