import axios from "axios";
import { Vendor } from "../types/vendor";

// Procurement service base URL (separate from engineering service)
const PROCUREMENT_API_BASE_URL =
  import.meta.env.VITE_PROCUREMENT_API_BASE_URL || "http://localhost:4006";

const apiClient = axios.create({
  baseURL: PROCUREMENT_API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export class VendorsService {
  private readonly baseUrl = "/api/v1/vendors";

  async getVendors(): Promise<Vendor[]> {
    const res = await apiClient.get(this.baseUrl);
    // Backend shape: { success: boolean, data: Vendor[] }
    return res.data?.data ?? [];
  }

  async getVendorById(id: string): Promise<Vendor | null> {
    const res = await apiClient.get(`${this.baseUrl}/${id}`);
    return res.data?.data ?? null;
  }

  async createVendor(payload: {
    vendor_name: string;
    classification: "Local" | "International" | "Principal" | "Distributor" | "Freelance";
    category?: string;
    is_preferred?: boolean;
  }): Promise<Vendor> {
    const res = await apiClient.post(this.baseUrl, payload);
    return res.data?.data as Vendor;
  }
}

export const vendorsService = new VendorsService();
