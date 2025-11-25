export interface Project {
  id: string;
  project_name: string;
  project_number: string;
  customer_id: string;
  contract_value: number;
  estimated_hpp?: number;
  actual_cost?: number;
  status: string;
  pm_user_id: string | null;
  sales_user_id: string | null;
  start_date?: string;
  expected_close_date?: string;
  actual_close_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  pm_user?: User;
  sales_user?: User;
  estimations?: Estimation[];
  project_boms?: ProjectBOM[];
  project_milestones?: ProjectMilestone[];
  activities?: ProjectActivity[];
  sales_orders?: SalesOrder[];
}

export interface SalesOrder {
  id: string;
  so_number: string;
  customer_po_number: string;
  order_date: string;
  contract_value: number;
  top_days_agreed?: number;
  po_document_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_name: string;
  channel?: string;
  city?: string;
  status?: string;
  alamat?: string;
  district?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  employee?: Employee;
}

export interface Employee {
  id: string;
  full_name: string;
  position: string;
  department?: string;
  phone?: string;
}

export interface Estimation {
  id: string;
  project_id: string;
  version: number;
  status: string;
  total_hpp: number;
  total_sell_price: number;
  items: EstimationItem[];
}

export interface EstimationItem {
  id: string;
  estimation_id: string;
  item_id: string;
  item_name?: string;
  item_type: 'MATERIAL' | 'SERVICE';
  quantity: number;
  hpp_at_estimation: number;
  sell_price_at_estimation: number;
}

export interface ProjectBOM {
  id: string;
  project_id: string;
  item_id: string;
  item_name?: string;
  item_type: 'MATERIAL' | 'SERVICE';
  quantity: number;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  tasks?: ProjectTask[];
}

export interface ProjectTask {
  id: string;
  project_id: string;
  milestone_id?: string;
  name: string;
  description?: string;
  assignee_id?: string;
  start_date?: string;
  due_date?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  progress: number;
  created_at: string;
  updated_at: string;
  assignee?: User;
  milestone?: ProjectMilestone;
}

// Aliases for better semantics
export type Milestone = ProjectMilestone;
export type Task = ProjectTask;

export interface MilestoneTemplate {
  id: number;
  template_name: string;
  project_type?: string;
  milestones: {
    name: string;
    duration_days: number;
    status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  }[];
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  activity_type: string;
  description: string;
  performed_by: string;
  performed_at: string;
  metadata?: any;
}

export interface ProjectManager {
  id: string;
  email: string;
  roles: string[];
  employee?: {
    full_name: string;
    position: string;
    department?: string;
  };
}

export interface BomItem {
  itemId: string;
  itemType: 'MATERIAL' | 'SERVICE';
  quantity: number;
}

export interface AssignPmRequest {
  pmUserId: string;
}

export interface CreateBomRequest {
  items: BomItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Team member (lightweight for assignment dropdown)
export interface TeamMember {
  id: string;
  name: string;
  role?: string;
}
