export type CustomerStatus = "ACTIVE" | "INACTIVE";

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  is_primary?: boolean;
  created_at?: string;
}

export interface CustomerRekening {
  id: string;
  customer_id: string;
  bank_name?: string;
  account_number: string;
  account_holder?: string;
}

export interface Customer {
  id: string;
  customer_name: string;
  code?: string;
  type?: string;
  channel?: string;
  city?: string;
  province?: string;
  district?: string;
  alamat?: string;
  status: CustomerStatus;
  top_days: number;
  sales_pic?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  created_by?: string;
  createdAt: string;
  updatedAt: string;
  customer_contacts?: CustomerContact[];
  customer_rekenings?: CustomerRekening[];
  sales_pic_user?: {
    id: string;
    email: string;
    employee?: {
      full_name: string;
    };
  };
}

export interface CustomerFormData {
  customer_name: string;
  code?: string;
  type?: string;
  channel?: string;
  city?: string;
  province?: string;
  district?: string;
  alamat?: string;
  status: CustomerStatus;
  top_days: number;
  sales_pic?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  contacts?: {
    name: string;
    position?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    is_primary?: boolean;
  }[];
  rekenings?: {
    bank_name?: string;
    account_number: string;
    account_holder?: string;
  }[];
}

export interface UpdateCustomerData {
  customer_name?: string;
  code?: string;
  type?: string;
  channel?: string;
  city?: string;
  province?: string;
  district?: string;
  alamat?: string;
  status?: CustomerStatus;
  top_days?: number;
  sales_pic?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  contacts?: {
    id?: string;
    name: string;
    position?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    is_primary?: boolean;
  }[];
  rekenings?: {
    id?: string;
    bank_name?: string;
    account_number: string;
    account_holder?: string;
  }[];
}

export interface CreateCustomerData {
  customer_name: string;
  code?: string;
  type?: string;
  channel: string;
  city: string;
  province?: string;
  district?: string;
  alamat?: string;
  status: CustomerStatus;
  top_days: number;
  sales_pic?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  contacts?: {
    name: string;
    position?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    is_primary?: boolean;
  }[];
  rekenings?: {
    bank_name?: string;
    account_number: string;
    account_holder?: string;
  }[];
}
