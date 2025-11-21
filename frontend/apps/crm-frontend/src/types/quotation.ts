/**
 * Quotation Types for CRM Frontend
 * Matches backend QuotationData interface
 */

export interface QuotationCustomer {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  picName?: string;
  picEmail?: string;
  picPhone?: string;
}

export interface QuotationOpportunity {
  id: string;
  projectName: string;
  description: string;
  status: string;
}

export interface QuotationSalesPerson {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface QuotationItem {
  id: string;
  itemName: string;
  description?: string;
  itemType: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface QuotationPricing {
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
}

export interface QuotationTerms {
  paymentTerms?: string;
  deliveryTerms?: string;
  warranty?: string;
  notes?: string;
}

export interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  customer: QuotationCustomer;
  opportunity: QuotationOpportunity;
  salesPerson: QuotationSalesPerson;
  items: QuotationItem[];
  pricing: QuotationPricing;
  terms?: QuotationTerms;
}
