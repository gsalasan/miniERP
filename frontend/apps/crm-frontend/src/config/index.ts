// CRM config and constants

export const config = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4002',
  CRM_SERVICE_URL:
    import.meta.env.VITE_CRM_SERVICE_URL || 'http://localhost:4002/api/v1',
  HR_SERVICE_URL:
    import.meta.env.VITE_HR_SERVICE_URL || 'http://localhost:8080/api/v1',
  ENGINEERING_SERVICE_URL:
    import.meta.env.VITE_ENGINEERING_SERVICE_URL ||
    'http://localhost:4001/api/v1',
};

// API endpoints
export const endpoints = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4002',
  PIPELINE: '/api/v1/pipeline',
  CUSTOMERS: '/api/v1/customers',
  CUSTOMER_CONTACTS: '/api/v1/customer-contacts',
};

// Authentication config
export const auth = {
  TOKEN_KEY: 'authToken',
  LEGACY_TOKEN_KEY: 'token',
  LOGIN_URL: 'http://localhost:3000/login',
};

// UI config
export const ui = {
  DEFAULT_PAGE_SIZE: 10,
};

export default config;
