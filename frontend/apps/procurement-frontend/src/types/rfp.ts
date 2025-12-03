// RFP Types
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
  id: string;
  rfp_id: string;
  item_name: string;
  item_type: RFPItemType;
  material_id?: string | null;
  service_id?: string | null;
  quantity: number;
  unit: string;
  notes?: string | null;
  created_at: string;
  material?: {
    id: string;
    item_name: string;
    brand?: string;
    satuan?: string;
  } | null;
  service?: {
    id: string;
    service_name: string;
    service_code: string;
    unit: string;
  } | null;
}

export interface RFP {
  id: string;
  rfp_number: string;
  project_id: string;
  project_name: string;
  requester_id: string;
  requester_name: string;
  status: RFPStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  processed_by?: string | null;
  processed_at?: string | null;
  items_count?: number;
  items?: RFPItem[];
  project?: {
    id: string;
    project_name: string;
    project_number: string;
    customer_id?: string;
  };
  requester?: {
    id: string;
    email: string;
    employee?: {
      full_name: string;
      position?: string;
      department?: string;
    } | null;
  };
  processor?: {
    id: string;
    email: string;
    employee?: {
      full_name: string;
    } | null;
  } | null;
  purchase_orders?: PurchaseOrder[];
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

export interface RFPListResponse {
  success: boolean;
  message: string;
  data: RFP[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// PO Types
export enum POStatus {
  DRAFT = 'DRAFT',
  SENT_TO_VENDOR = 'SENT_TO_VENDOR',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface POItem {
  id: string;
  po_id: string;
  item_name: string;
  item_type: RFPItemType;
  material_id?: string | null;
  service_id?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  notes?: string | null;
  material?: {
    id: string;
    item_name: string;
    brand?: string;
    satuan?: string;
  } | null;
  service?: {
    id: string;
    service_name: string;
    service_code: string;
    unit: string;
  } | null;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  rfp_id?: string | null;
  vendor_id?: string | null;
  vendor_name: string;
  order_date: string;
  expected_delivery?: string | null;
  total_amount: number;
  status: POStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  items?: POItem[];
  rfp?: {
    id: string;
    rfp_number: string;
    project_name: string;
    requester_name: string;
  } | null;
  creator?: {
    id: string;
    email: string;
    employee?: {
      full_name: string;
    } | null;
  };
}

export interface CreatePOFromRFPRequest {
  vendor_id?: string | null;
  vendor_name: string;
  order_date: string;
  expected_delivery?: string | null;
  notes?: string | null;
  created_by: string;
  items: Array<{
    rfp_item_id: string;
    unit_price: number;
    notes?: string | null;
  }>;
}

export interface CreatePOFromRFPResponse {
  success: boolean;
  message: string;
  data: PurchaseOrder;
}
