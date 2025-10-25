import axios from "axios";
import { Customer, CreateCustomerData, UpdateCustomerData } from "../types/customer";

// Base URL for CRM service
const CRM_BASE_URL = "http://localhost:3002/api/v1";

// Create axios instance for CRM service
const crmApi = axios.create({
  baseURL: CRM_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
crmApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
crmApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("authToken");
      // Redirect to login if needed
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const customersApi = {
  // Get all customers
  getAllCustomers: async (): Promise<Customer[]> => {
    try {
      const response = await crmApi.get("/customers");
      return response.data.data || response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching customers:", error);
      throw new Error("Gagal memuat data customer");
    }
  },

  // Get customer by ID
  getCustomerById: async (id: string): Promise<Customer> => {
    try {
      const response = await crmApi.get(`/customers/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching customer:", error);
      throw new Error("Gagal memuat data customer");
    }
  },

  // Create new customer
  createCustomer: async (data: CreateCustomerData): Promise<Customer> => {
    try {
      const response = await crmApi.post("/customers", data);
      return response.data.data || response.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating customer:", error);
      throw new Error("Gagal membuat customer baru");
    }
  },

  // Update customer
  updateCustomer: async (id: string, data: UpdateCustomerData): Promise<Customer> => {
    try {
      const response = await crmApi.put(`/customers/${id}`, data);
      return response.data.data || response.data;
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error("Error updating customer:", error);
      // Get specific error message from backend if available
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string; errors?: string[] } };
        };
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        } else if (
          axiosError.response?.data?.errors &&
          Array.isArray(axiosError.response.data.errors)
        ) {
          throw new Error(axiosError.response.data.errors.join(", "));
        }
      }
      throw new Error("Gagal mengupdate customer");
    }
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<void> => {
    try {
      await crmApi.delete(`/customers/${id}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting customer:", error);
      throw new Error("Gagal menghapus customer");
    }
  },

  // Delete customer contact
  deleteCustomerContact: async (customerId: string, contactId: string): Promise<void> => {
    try {
      await crmApi.delete(`/customers/${customerId}/contacts/${contactId}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting customer contact:", error);
      throw new Error("Gagal menghapus kontak customer");
    }
  },
};
