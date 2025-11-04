// API Base URLs
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4006/api/v1";
export const MAIN_FRONTEND_URL = import.meta.env.VITE_MAIN_FRONTEND_URL || "http://localhost:3000";

// Service Endpoints
export const ENDPOINTS = {
  PROCUREMENT: API_BASE_URL,
  VENDORS: `${API_BASE_URL}/vendors`,
  VENDOR_PRICELIST: `${API_BASE_URL}/vendor-pricelist`,
  MATERIALS_PROXY: `${API_BASE_URL}/materials-proxy`,
};

// Navigation URLs
export const NAVIGATION = {
  HOME: MAIN_FRONTEND_URL,
  LOGIN: `${MAIN_FRONTEND_URL}/login`,
};