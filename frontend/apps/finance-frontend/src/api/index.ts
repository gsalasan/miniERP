<<<<<<< HEAD
// API utilities and endpoints for Finance module// API utilities and endpoints for Finance module

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

// API Functions
export const chartOfAccountsAPI = {
  getAll: async (): Promise<ChartOfAccount[]> => {
    const response = await fetch(API_ENDPOINTS.CHART_OF_ACCOUNTS);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    console.log('🔍 COA API Response:', json);
    // Backend returns { success, data } - extract data array
    return json.data || [];
  },

  getById: async (id: number): Promise<ChartOfAccount> => {
    const response = await fetch(`${API_ENDPOINTS.CHART_OF_ACCOUNTS}/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  },

  create: async (data: CreateChartOfAccountDto): Promise<ChartOfAccount> => {
    const response = await fetch(API_ENDPOINTS.CHART_OF_ACCOUNTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  },

  update: async (id: number, data: UpdateChartOfAccountDto): Promise<ChartOfAccount> => {
    const response = await fetch(`${API_ENDPOINTS.CHART_OF_ACCOUNTS}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_ENDPOINTS.CHART_OF_ACCOUNTS}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  },
};

// Journal Entry Types
export interface JournalEntry {
=======
// API utilities and endpoints for Finance module
export type ChartOfAccount = {
  id: number;
  account_code: string;
  account_name: string;
};

export type JournalEntry = {
>>>>>>> origin/main
  id: string;
  transaction_date: string;
  description?: string;
  account_id: number;
<<<<<<< HEAD
  debit?: number;
  credit?: number;
  reference_id?: string;
  reference_type?: string;
  created_by?: string;
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

export const journalEntriesAPI = {
  getAll: async (): Promise<JournalEntry[]> => {
    const response = await fetch('/api/journal-entries');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const json = await response.json();
    return json.data || [];
  },
  
  create: async (data: CreateJournalEntryDto): Promise<JournalEntry> => {
    const response = await fetch('/api/journal-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/journal-entries/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  },
};

// Tax Rate Types
export interface TaxRate {
  id: number;
  tax_name: string;
  tax_code: string;
  rate: string | number;
  description?: string;
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

export interface TaxRatesResponse {
  success: boolean;
  message: string;
  data: TaxRate[];
}

export const taxRatesAPI = {
  getAll: async (params?: { is_active?: boolean }): Promise<TaxRatesResponse> => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await fetch(`/api/tax-rates${queryString}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getById: async (id: number): Promise<TaxRate> => {
    const response = await fetch(`/api/tax-rates/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  },
  
  create: async (data: CreateTaxRateDto): Promise<TaxRate> => {
    const response = await fetch('/api/tax-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  },
  
  update: async (id: number, data: UpdateTaxRateDto): Promise<TaxRate> => {
    const response = await fetch(`/api/tax-rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  },
  
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/tax-rates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  },
};

// Exchange Rate Types
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
=======
  debit?: number | string;
  credit?: number | string;
  reference_id?: string;
  reference_type?: string;
};

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

export type TaxRate = {
  id: number;
  name: string;
  rate: number;
  description?: string;
};

export type CreateTaxRateDto = Omit<TaxRate, 'id'>;
export type UpdateTaxRateDto = Partial<CreateTaxRateDto>;

export const chartOfAccountsAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/chart-of-accounts`);
    return res.json();
  },
  async create(payload: Partial<ChartOfAccount>) {
    const res = await fetch(`${API_BASE}/chart-of-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: number, payload: Partial<ChartOfAccount>) {
    const res = await fetch(`${API_BASE}/chart-of-accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: number) {
    const res = await fetch(`${API_BASE}/chart-of-accounts/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

export const journalEntriesAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/journal-entries`);
    return res.json();
  },
  async create(payload: Partial<JournalEntry>) {
    const res = await fetch(`${API_BASE}/journal-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: string, payload: Partial<JournalEntry>) {
    const res = await fetch(`${API_BASE}/journal-entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: string) {
    const res = await fetch(`${API_BASE}/journal-entries/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

export const taxRatesAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE}/tax-rates`);
    return res.json();
  },
  async create(payload: CreateTaxRateDto) {
    const res = await fetch(`${API_BASE}/tax-rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: number, payload: UpdateTaxRateDto) {
    const res = await fetch(`${API_BASE}/tax-rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: number) {
    const res = await fetch(`${API_BASE}/tax-rates/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

export type ExchangeRate = {
  id: number;
  currency_from: string;
  currency_to: string;
  rate: number | string;
  effective_date: string;
  is_active: boolean;
};

export type CreateExchangeRateDto = {
>>>>>>> origin/main
  currency_from: string;
  currency_to: string;
  rate: number;
  effective_date: string;
<<<<<<< HEAD
  is_active?: boolean;
}

export interface UpdateExchangeRateDto {
  currency_from?: string;
  currency_to?: string;
  rate?: number;
  effective_date?: string;
  is_active?: boolean;
}

export interface ExchangeRatesResponse {
  success: boolean;
  message: string;
  data: ExchangeRate[];
}

export const exchangeRatesAPI = {
  getAll: async (params?: { is_active?: boolean }): Promise<ExchangeRatesResponse> => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    const response = await fetch(`/api/exchange-rates${queryString}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  
  getById: async (id: number): Promise<ExchangeRate> => {
    const response = await fetch(`/api/exchange-rates/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  },
  
  create: async (data: CreateExchangeRateDto): Promise<ExchangeRate> => {
    const response = await fetch('/api/exchange-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  },
  
  update: async (id: number, data: UpdateExchangeRateDto): Promise<ExchangeRate> => {
    const response = await fetch(`/api/exchange-rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  },
  
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/exchange-rates/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
  },
};

// Pricing Rules Types
export interface PricingRule {
  id: number;
  category: string;
  markup_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePricingRuleDto {
  category: string;
  markup_percentage: number;
}

export interface UpdatePricingRuleDto {
  category?: string;
  markup_percentage?: number;
}

export const pricingRulesAPI = {
  getAll: async (): Promise<PricingRule[]> => {
    const response = await fetch('/api/pricing-rules');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getById: async (id: number): Promise<PricingRule> => {
    const response = await fetch(`/api/pricing-rules/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getByCategory: async (category: string): Promise<PricingRule> => {
    const response = await fetch(`/api/pricing-rules/category/${encodeURIComponent(category)}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  create: async (data: CreatePricingRuleDto): Promise<PricingRule> => {
    const response = await fetch('/api/pricing-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  update: async (id: number, data: UpdatePricingRuleDto): Promise<PricingRule> => {
    const response = await fetch(`/api/pricing-rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/pricing-rules/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
  },
};

// Overhead Cost Allocations Types
export interface OverheadAllocation {
  id: number;
  cost_category: string;
  target_percentage: number | null;
  allocation_percentage_to_hpp: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOverheadAllocationDto {
  cost_category: string;
  target_percentage?: number | null;
  allocation_percentage_to_hpp: number;
}

export interface UpdateOverheadAllocationDto {
  cost_category?: string;
  target_percentage?: number | null;
  allocation_percentage_to_hpp?: number;
}

export const overheadAllocationsAPI = {
  getAll: async (): Promise<OverheadAllocation[]> => {
    const response = await fetch('/api/overhead-allocations');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getById: async (id: number): Promise<OverheadAllocation> => {
    const response = await fetch(`/api/overhead-allocations/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getByCategory: async (category: string): Promise<OverheadAllocation> => {
    const response = await fetch(`/api/overhead-allocations/category/${encodeURIComponent(category)}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  create: async (data: CreateOverheadAllocationDto): Promise<OverheadAllocation> => {
    const response = await fetch('/api/overhead-allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  update: async (id: number, data: UpdateOverheadAllocationDto): Promise<OverheadAllocation> => {
    const response = await fetch(`/api/overhead-allocations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/overhead-allocations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
  },
};

// Discount Policies Types
export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | 'HR' | 'FINANCE';

export interface DiscountPolicy {
  id: number;
  user_role: UserRole;
  max_discount_percentage: number;
  requires_approval_above: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDiscountPolicyDto {
  user_role: UserRole;
  max_discount_percentage: number;
  requires_approval_above?: number | null;
}

export interface UpdateDiscountPolicyDto {
  user_role?: UserRole;
  max_discount_percentage?: number;
  requires_approval_above?: number | null;
}

export const discountPoliciesAPI = {
  getAll: async (): Promise<DiscountPolicy[]> => {
    const response = await fetch('/api/discount-policies');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getById: async (id: number): Promise<DiscountPolicy> => {
    const response = await fetch(`/api/discount-policies/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  getByRole: async (role: UserRole): Promise<DiscountPolicy> => {
    const response = await fetch(`/api/discount-policies/role/${role}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  create: async (data: CreateDiscountPolicyDto): Promise<DiscountPolicy> => {
    const response = await fetch('/api/discount-policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  update: async (id: number, data: UpdateDiscountPolicyDto): Promise<DiscountPolicy> => {
    const response = await fetch(`/api/discount-policies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/discount-policies/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
  },
};

=======
  is_active: boolean;
};

export type UpdateExchangeRateDto = Partial<CreateExchangeRateDto>;

export const exchangeRatesAPI = {
  async getAll(params?: { is_active?: boolean }) {
    const qs = params && typeof params.is_active === 'boolean'
      ? `?is_active=${params.is_active}`
      : '';
    const res = await fetch(`${API_BASE}/exchange-rates${qs}`);
    return res.json();
  },
  async create(payload: CreateExchangeRateDto) {
    const res = await fetch(`${API_BASE}/exchange-rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async update(id: number, payload: UpdateExchangeRateDto) {
    const res = await fetch(`${API_BASE}/exchange-rates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async delete(id: number) {
    const res = await fetch(`${API_BASE}/exchange-rates/${id}`, { method: 'DELETE' });
    return res.json();
  },
};
>>>>>>> origin/main
