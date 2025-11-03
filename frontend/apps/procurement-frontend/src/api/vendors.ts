import axios from "axios";
import { Vendor } from "../types/vendor";

import axios from "axios";
import { ENDPOINTS } from "../config/environment";

const PROCUREMENT_BASE_URL = ENDPOINTS.PROCUREMENT;

const procurementApi = axios.create({
  baseURL: PROCUREMENT_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

procurementApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

procurementApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  },
);

export const vendorsApi = {
  getAllVendors: async (): Promise<Vendor[]> => {
    try {
      const res = await procurementApi.get("/vendors");
      return res.data.data || res.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching vendors:", error);
      throw new Error("Gagal memuat data vendors");
    }
  },

  deleteVendor: async (id: string): Promise<void> => {
    try {
      await procurementApi.delete(`/vendors/${id}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting vendor:", error);
      throw new Error("Gagal menghapus vendor");
    }
  },
  createVendor: async (data: {
    vendor_name: string;
    category?: string;
    classification: string;
    is_preferred?: boolean;
  }): Promise<Vendor> => {
    try {
      const res = await procurementApi.post("/vendors", data);
      return res.data.data || res.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating vendor:", error);
      throw new Error("Gagal membuat vendor");
    }
  },
  getVendor: async (id: string): Promise<Vendor> => {
    try {
      const res = await procurementApi.get(`/vendors/${id}`);
      return res.data.data || res.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching vendor:", error);
      throw new Error("Gagal memuat vendor");
    }
  },

  updateVendor: async (id: string, data: Partial<Vendor>): Promise<Vendor> => {
    try {
      const res = await procurementApi.put(`/vendors/${id}`, data);
      return res.data.data || res.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating vendor:", error);
      throw new Error("Gagal memperbarui vendor");
    }
  },
};
