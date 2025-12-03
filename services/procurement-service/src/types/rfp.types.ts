export enum RFPStatus {
  PENDING = 'PENDING',
  IN_PROCESS = 'IN_PROCESS',
  PO_CREATED = 'PO_CREATED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RFPItemType {
  MATERIAL = 'MATERIAL',
  SERVICE = 'SERVICE',
}

export interface RFPItem {
  id?: string;
  rfp_id?: string;
  item_name: string;
  item_type: RFPItemType;
  material_id?: string | null;
  service_id?: string | null;
  quantity: number;
  unit: string;
  notes?: string | null;
}

export interface CreateRFPRequest {
  project_id: string;
  project_name: string;
  requester_id: string;
  requester_name: string;
  notes?: string | null;
  items: RFPItem[];
}

export interface UpdateRFPStatusRequest {
  status: RFPStatus;
  processed_by?: string;
}

export interface RFPListQuery {
  status?: RFPStatus;
  project_id?: string;
  requester_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
