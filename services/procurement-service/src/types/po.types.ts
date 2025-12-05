export enum POStatus {
  DRAFT = 'DRAFT',
  SENT_TO_VENDOR = 'SENT_TO_VENDOR',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface POItem {
  id?: string;
  po_id?: string;
  item_name: string;
  item_type: 'MATERIAL' | 'SERVICE';
  material_id?: string | null;
  service_id?: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  notes?: string | null;
}

export interface CreatePORequest {
  rfp_id?: string | null;
  vendor_id?: string | null;
  vendor_name: string;
  order_date: string;
  expected_delivery?: string | null;
  total_amount: number;
  status?: POStatus;
  notes?: string | null;
  created_by: string;
  items: POItem[];
}

export interface CreatePOFromRFPRequest {
  rfp_id: string;
  vendor_id?: string | null;
  vendor_name: string;
  order_date: string;
  expected_delivery?: string | null;
  payment_terms?: string | null;
  notes?: string | null;
  created_by: string;
  items: Array<{
    rfp_item_id: string;
    unit_price: number;
    notes?: string | null;
  }>;
}
