export interface Vendor {
  id: string;
  vendor_name: string;
  category?: string | null;
  classification?: string | null;
  is_preferred?: boolean;
  created_at?: string;
  updated_at?: string;
}
