export type VendorPrice = {
  id: string;
  material_id: string;
  vendor_id: string;
  price: string | number;
  currency: string;
  price_updated_at?: string;
  Material?: { id: string; item_name?: string } | null;
  Vendor?: { id: string; vendor_name?: string } | null;
};
