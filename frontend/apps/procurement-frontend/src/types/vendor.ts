export type Vendor = {
  id: string;
  vendor_name: string;
  category?: string | null;
  classification: "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE" | "GOVERNMENT";
  is_preferred: boolean;
  created_at?: string;
  updated_at?: string;
};