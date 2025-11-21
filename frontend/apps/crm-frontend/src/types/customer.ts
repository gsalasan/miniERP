export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT';

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  position?: string;
  email?: string;
  phone?: string;
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
  channel: string;
  city: string;
  district?: string;
  alamat?: string;
  status: CustomerStatus;
  top_days: number;
  assigned_sales_id?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  createdAt: string;
  updatedAt: string;
  customer_contacts?: CustomerContact[];
  customer_rekenings?: CustomerRekening[];
}

export interface CreateCustomerData {
  customer_name: string;
  channel: string;
  city: string;
  district?: string;
  alamat?: string;
  status: CustomerStatus;
  top_days: number;
  assigned_sales_id?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  contacts?: {
    name: string;
    position?: string;
    email?: string;
    phone?: string;
  }[];
  rekenings?: {
    bank_name?: string;
    account_number: string;
    account_holder?: string;
  }[];
}

export interface UpdateCustomerData {
  customer_name?: string;
  channel?: string;
  city?: string;
  district?: string;
  alamat?: string;
  status?: CustomerStatus;
  top_days?: number;
  assigned_sales_id?: string;
  credit_limit?: number;
  no_npwp?: string;
  sppkp?: string;
  contacts?: {
    id?: string;
    name: string;
    position?: string;
    email?: string;
    phone?: string;
  }[];
  rekenings?: {
    id?: string;
    bank_name?: string;
    account_number: string;
    account_holder?: string;
  }[];
}
