import axios from "axios";
import { VendorPrice } from "../types/vendorPricelist";

import axios from "axios";
import { ENDPOINTS } from "../config/environments";

const PROCUREMENT_BASE_URL = ENDPOINTS.PROCUREMENT;

const procurementApi = axios.create({
  baseURL: PROCUREMENT_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

procurementApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const vendorPricelistApi = {
  getAll: async (): Promise<VendorPrice[]> => {
    try {
      const res = await procurementApi.get("/vendor-pricelist");
      return res.data.data || res.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching vendor pricelist:", error);
      throw new Error("Gagal memuat vendor pricelist");
    }
  },

  create: async (data: Partial<VendorPrice>): Promise<VendorPrice> => {
    try {
      const res = await procurementApi.post("/vendor-pricelist", data);
      return res.data.data || res.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating vendor pricelist:", error);
      throw new Error("Gagal membuat vendor pricelist");
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await procurementApi.delete(`/vendor-pricelist/${id}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error deleting vendor pricelist:", error);
      throw new Error("Gagal menghapus vendor pricelist");
    }
  },
  getById: async (id: string) => {
    try {
      const res = await procurementApi.get(`/vendor-pricelist/${id}`);
      return res.data.data || res.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching vendor pricelist by id:", error);
      throw new Error("Gagal memuat vendor pricelist");
    }
  },

  update: async (id: string, data: Partial<any>) => {
    try {
      const res = await procurementApi.put(`/vendor-pricelist/${id}`, data);
      return res.data.data || res.data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating vendor pricelist:", error);
      throw new Error("Gagal memperbarui vendor pricelist");
    }
  },
};