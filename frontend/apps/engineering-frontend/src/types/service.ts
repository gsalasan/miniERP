// Service related types
export enum ServiceUnit {
  Jam = "Jam",
  Hari = "Hari",
}

export interface Service {
  id: string;
  service_name: string;
  service_code: string;
  item_type?: string;
  category?: string;
  unit: ServiceUnit;
  internal_cost_per_hour?: number;
  freelance_cost_per_hour?: number;
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
  category?: string;
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
  byCategory: { category: string; count: number }[];
}

export interface ServiceFilterOptions {
  categories: string[];
  units: ServiceUnit[];
  item_types: string[];
}
