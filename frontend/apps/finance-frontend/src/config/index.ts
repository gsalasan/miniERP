// Finance config and constants
<<<<<<< HEAD

// Use relative path for API calls - Vite will proxy to backend
export const API_BASE_URL = '';  // Empty for relative URLs
export const FINANCE_API_URL = `/api`;

console.log('🔧 Config loaded:');
console.log('  API_BASE_URL:', API_BASE_URL || '(relative)');
console.log('  FINANCE_API_URL:', FINANCE_API_URL);

export const API_ENDPOINTS = {
  CHART_OF_ACCOUNTS: FINANCE_API_URL,
};

console.log('  CHART_OF_ACCOUNTS endpoint:', API_ENDPOINTS.CHART_OF_ACCOUNTS);

export const ACCOUNT_TYPES = [
  { value: 'Asset', label: 'Asset' },
  { value: 'Liability', label: 'Liability' },
  { value: 'Equity', label: 'Equity' },
  { value: 'Revenue', label: 'Revenue' },
  { value: 'Expense', label: 'Expense' },
] as const;

export type AccountType = typeof ACCOUNT_TYPES[number]['value'];
=======
>>>>>>> main
