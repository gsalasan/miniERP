export enum WOStatus {
  DRAFT = 'DRAFT',
  SENT_TO_VENDOR = 'SENT_TO_VENDOR',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface WOItem {
  id?: string;
  wo_id?: string;
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

export interface CreateWORequest {
  rfp_id?: string | null;
  vendor_id?: string | null;
  vendor_name: string;
  order_date: string;
  expected_completion?: string | null;
  total_amount: number;
  status?: WOStatus;
  payment_terms?: string | null;
  notes?: string | null;
  created_by: string;
  items: WOItem[];
}

export interface CreateWOFromRFPRequest {
  rfp_id: string;
  vendor_id?: string | null;
  vendor_name: string;
  order_date: string;
  expected_completion?: string | null;
  payment_terms?: string | null;
  notes?: string | null;
  created_by: string;
  items: Array<{
    rfp_item_id: string;
    unit_price: number;
    notes?: string | null;
  }>;
}
