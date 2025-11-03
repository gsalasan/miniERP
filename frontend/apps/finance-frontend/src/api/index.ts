// API utilities and endpoints for Finance module
export type ChartOfAccount = {
  id: number;
  account_code: string;
  account_name: string;
};

export type JournalEntry = {
  id: string;
  transaction_date: string;
  description?: string;
  account_id: number;
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
  currency_from: string;
  currency_to: string;
  rate: number;
  effective_date: string;
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
