// Finance config and constants

// Use relative path for API calls - Vite will proxy to backend
export const API_BASE_URL = '';  // Empty for relative URLs
export const FINANCE_API_URL = `/api`;

console.log('🔧 Config loaded:');
console.log('  API_BASE_URL:', API_BASE_URL || '(relative)');
console.log('  FINANCE_API_URL:', FINANCE_API_URL);

export const API_ENDPOINTS = {
  CHART_OF_ACCOUNTS: `${FINANCE_API_URL}/chart-of-accounts`,
  JOURNAL_ENTRIES: `${FINANCE_API_URL}/journal-entries`,
  TAX_RATES: `${FINANCE_API_URL}/tax-rates`,
  EXCHANGE_RATES: `${FINANCE_API_URL}/exchange-rates`,
  PRICING_RULES: `${FINANCE_API_URL}/pricing-rules`,
  OVERHEAD_ALLOCATIONS: `${FINANCE_API_URL}/overhead-allocations`,
  DISCOUNT_POLICIES: `${FINANCE_API_URL}/discount-policies`,
  INVOICES: `${FINANCE_API_URL}/invoices`,
  REPORTS: `${FINANCE_API_URL}/reports`,
};

console.log('  CHART_OF_ACCOUNTS endpoint:', API_ENDPOINTS.CHART_OF_ACCOUNTS);

export const ACCOUNT_TYPES = [
  { value: 'Asset', label: 'Asset' },
  { value: 'Liability', label: 'Liability' },
  { value: 'Equity', label: 'Equity' },
  { value: 'Revenue', label: 'Revenue' },
  { value: 'Cost of Service', label: 'Cost of Service' },
  { value: 'Expense', label: 'Expense' },
] as const;

export type AccountType = typeof ACCOUNT_TYPES[number]['value'];
