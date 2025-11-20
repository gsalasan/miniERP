export interface Estimation {
  id: string;
  project_id?: string | null;
  version: number;
  status: EstimationStatus;

  // Assignment fields
  assigned_to_user_id?: string | null;
  requested_by_user_id?: string | null; // FITUR 3.1.D: Sales yang buat request

  // Request information (FITUR 3.1.D)
  technical_brief?: string | null; // Ringkasan kebutuhan & brief teknis
  attachments?: Array<{ name: string; url: string }> | null; // Dokumen pendukung

  // Legacy fields (deprecated)
  sales_pic?: string | null;
  customer_name?: string | null;

  // New fields from schema
  client_name?: string | null;
  client_id?: string | null;
  submitted_by_user_id?: string | null;
  submitted_at?: Date | string | null;
  approved_by_user_id?: string | null;
  approved_at?: Date | string | null;
  gross_margin_percentage?: number | null;
  ce_number?: string | null;
  ce_date?: Date | string | null;
  ce_period_start?: Date | string | null;
  ce_period_end?: Date | string | null;
  so_number?: string | null; // Sales Order reference
  so_date?: Date | string | null; // SO date
  sales_order_id?: string | null;
  sales_order?: {
    id: string;
    so_number: string;
    order_date: Date | string;
  } | null;

  // Relations
  client?: Customer | null;
  submitted_by?: AssignedUser | null;
  approved_by?: AssignedUser | null;

  // Date tracking
  date_requested?: Date | string;
  date_assigned?: Date | string | null;
  date_started?: Date | string | null;
  date_completed?: Date | string | null;

  // Financial data
  total_direct_hpp: number;
  total_overhead_allocation: number;
  total_hpp: number;
  total_sell_price: number;

  created_at?: Date | string;
  updated_at?: Date | string;

  // Relations
  project?: Project;
  assigned_to?: AssignedUser;
  requested_by?: AssignedUser; // FITUR 3.1.D: User yang request (Sales)
  items?: EstimationItem[];
}

export interface AssignedUser {
  id: string;
  email: string;
  employee?: {
    id: string;
    full_name: string;
  };
}

export interface EstimationItem {
  // Customer type for client relation
  export interface Customer {
    id: string;
    name: string;
    email?: string;
  }
  id: string;
  estimation_id: string;
  item_id: string;
  item_type: ItemType;
  quantity: number;
  source: SourceType;
  hpp_at_estimation: number;
  sell_price_at_estimation: number;
}

export interface Project {
  id: string;
  project_name: string;
  project_number: string;
  client_name?: string;
  start_date?: Date;
  end_date?: Date;
  status: string;
  contract_value: number;
  estimated_hpp?: number;
  actual_cost?: number;
  customer?: {
    id: string;
    customer_name: string;
    city?: string;
  };
}

export type EstimationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUIRED"
  | "DRAFT"
  | "ARCHIVED"
  | "PENDING_DISCOUNT_APPROVAL"
  | "DISCOUNT_APPROVED";
export type ItemType = "MATERIAL" | "SERVICE";
export type SourceType = "INTERNAL" | "EXTERNAL";

export interface EstimationCalculationInput {
  project_id?: string;
  items: CalculationItem[];
  overhead_percentage?: number;
  profit_margin_percentage?: number;
  save_to_db?: boolean;
  version?: number;
  status?: string;
}

export interface CalculationItem {
  item_id: string;
  item_type: ItemType;
  quantity: number;
  source?: SourceType;
}

export interface EstimationCalculationResult {
  project_id?: string;
  estimation_id?: string;
  saved?: boolean;
  items: CalculatedItem[];
  summary: EstimationSummary;
}

export interface CalculatedItem {
  item_id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  source: string;
  hpp_per_unit: number;
  total_hpp: number;
  sell_price_per_unit: number;
  total_sell_price: number;
}

export interface EstimationSummary {
  total_direct_hpp: number;
  overhead_percentage: number;
  total_overhead_allocation: number;
  total_hpp: number;
  profit_margin_percentage: number;
  total_sell_price: number;
}

export interface EstimationResponse {
  data: Estimation;
  success: boolean;
}

export interface EstimationsResponse {
  data: Estimation[];
  success: boolean;
}

// ============================================
// FITUR 3.2.B: Kalkulator Estimasi Modular
// ============================================

export type SectionType = "MATERIAL" | "SERVICE";

// Material Section
export interface MaterialSection {
  id: string;
  type: "MATERIAL";
  title: string;
  items: MaterialRowItem[];
}

export interface MaterialRowItem {
  id: string;
  material_id: string;
  material_name: string;
  brand?: string;
  vendor?: string;
  vendor_pricelist_id?: string;
  quantity: number;
  unit: string;
  hpp_per_unit: number;
  currency?: string;
  total_hpp: number;
}

// Service Section
export interface ServiceSection {
  id: string;
  type: "SERVICE";
  title: string;
  serviceGroups: ServiceGroup[];
}

export interface ServiceGroup {
  id: string;
  group_label: string; // "Jasa Instalasi CCTV"
  items: ServiceRowItem[];
}

export interface ServiceRowItem {
  id: string;
  service_id: string;
  service_name: string;
  service_code?: string;
  source: "Internal" | "Freelance";
  quantity: number; // Jam/Hari
  unit: string;
  cost_per_unit: number;
  total_hpp: number;
}

// Union type for all section types
export type BoQSection = MaterialSection | ServiceSection;

// Calculator State
export interface CalculatorState {
  estimationId?: string;
  projectId?: string;
  sections: BoQSection[];
}

// Financial Summary (Panel Kanan)
export interface FinancialSummary {
  total_direct_hpp: number;
  overhead_allocation: number;
  overhead_percentage?: number;
  total_estimasi_hpp: number;
  total_harga_jual_standar: number;
  estimasi_gross_margin: number;
  estimasi_gross_margin_pct: number;
  estimasi_net_margin: number;
  estimasi_net_margin_pct: number;
  
  // NEW: Enhanced fields from PricingEngine & OverheadEngine integration
  overhead_breakdown?: OverheadBreakdownItem[];
  pricing_summary?: PricingSummary;
  average_markup_percentage?: number;
  policy_applied?: string;
}

// Overhead Breakdown Item (22 categories)
export interface OverheadBreakdownItem {
  category: string;
  target_percentage: number;
  allocation_percentage_to_hpp: number;
  allocated_amount: number;
  description: string;
}

// Pricing Summary from PricingEngine
export interface PricingSummary {
  total_items: number;
  total_hpp: number;
  total_markup: number;
  total_sell_price: number;
  average_markup_percentage: number;
}

// Submit Request
export interface SubmitEstimationRequest {
  sections: BoQSection[];
  status?: "DRAFT" | "PENDING_APPROVAL";
}
