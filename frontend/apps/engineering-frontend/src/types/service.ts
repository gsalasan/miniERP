// Service related types
import { ServiceUnit } from "./enums";

export interface Service {
  id: string;
  service_name: string;
  service_code: string;
  item_type?: string;
  // Legacy string fields (for backward compatibility with old data)
  sbu?: string;
  kategori_sistem?: string;
  sub_sistem?: string;
  fase_proyek?: string;
  kategori_jasa?: string;
  jenis_jasa_spesifik?: string;
  deskripsi?: string;
  rekomendasi_tim?: string;
  // New UUID FK fields
  kategori_sistem_id?: string;
  sub_sistem_id?: string;
  kategori_jasa_id?: string;
  jenis_jasa_spesifik_id?: string;
  deskripsi_id?: string;
  rekomendasi_tim_id?: string;
  fase_proyek_id?: string;
  sbu_id?: string;
  // Joined taxonomy names (from backend)
  kategori_sistem_name?: string;
  sub_sistem_name?: string;
  kategori_jasa_name?: string;
  jenis_jasa_spesifik_name?: string;
  deskripsi_text?: string;
  rekomendasi_tim_name?: string;
  fase_proyek_name?: string;
  sbu_name?: string;
  unit: ServiceUnit;
  default_duration?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  service_name?: string;
  service_code?: string;
  unit?: ServiceUnit;
  is_active?: boolean;
  item_type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ServicesResponse {
  success: boolean;
  message: string;
  data: Service[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  data: Service;
}

export interface ServicesStatsResponse {
  success: boolean;
  message: string;
  data: ServicesStats;
}

export interface ServicesStats {
  total: number;
  active: number;
  inactive: number;
  byUnit: { unit: string; count: number }[];
}

export interface ServiceFilterOptions {
  units: ServiceUnit[];
  item_types: string[];
}
