import axios from "axios";
import { Material } from "../../types/material";
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

export const materialsApi = {
  async getAll(): Promise<Material[]> {
    // Gunakan endpoint proxy procurement-service
    const res = await procurementApi.get("/materials-proxy/api/materials");
    // Jika response berbentuk { success, data, ... }, ambil data arraynya
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  },
};