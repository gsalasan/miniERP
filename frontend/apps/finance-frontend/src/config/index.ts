// Finance config and constants

export const ACCOUNT_TYPES = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
];

export const API_ENDPOINTS = import.meta.env.VITE_API_URL || "http://localhost:4002"

export default ACCOUNT_TYPES;
