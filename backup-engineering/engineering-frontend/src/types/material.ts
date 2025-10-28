// Material related types

export enum MaterialStatus {
  Active = "Active",
  EndOfLife = "EndOfLife",
  Discontinue = "Discontinue",
}

export enum MaterialLocation {
  Local = "Local",
  Import = "Import",
}

export interface Material {
  id: string;
  sbu?: string;
  system?: string;
  subsystem?: string;
  components?: string;
  item_name: string;
  brand?: string;
  owner_pn?: string;
  vendor?: string;
  status?: MaterialStatus;
  location?: MaterialLocation;
  cost_ori?: number;
  curr?: string;
  satuan?: string;
  cost_rp?: number;
  cost_validity?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sbu?: string;
  system?: string;
  subsystem?: string;
  status?: MaterialStatus;
  location?: MaterialLocation;
  vendor?: string;
  brand?: string;
}

export interface MaterialsResponse {
  success: boolean;
  data: Material[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface MaterialResponse {
  success: boolean;
  data: Material;
}

export interface MaterialsStats {
  totalMaterials: number;
  activeMaterials: number;
  discontinuedMaterials: number;
  endOfLifeMaterials: number;
}

export interface FilterOptions {
  sbus: string[];
  systems: string[];
  subsystems: string[];
  vendors: string[];
  brands: string[];
  statuses: MaterialStatus[];
  locations: MaterialLocation[];
}
