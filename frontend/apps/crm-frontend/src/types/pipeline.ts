export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Project {
  id: string;
  project_name: string;
  description?: string;
  status: ProjectStatus;
  contract_value?: number;
  estimated_value?: number;
  lead_score?: number;
  sales_user_id: string;
  customer_id: string;
  estimation_status?: string;
  priority?: string;
  expected_close_date?: string;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    name: string;
    city: string;
  };
  sales_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export enum ProjectStatus {
  PROSPECT = "PROSPECT",
  MEETING_SCHEDULED = "MEETING_SCHEDULED",
  PRE_SALES = "PRE_SALES",
  PROPOSAL_DELIVERED = "PROPOSAL_DELIVERED",
  WON = "WON",
  LOST = "LOST",
}
export interface PipelineColumn {
  items: Project[];
  totalValue: number;
  count: number;
}

export interface Pipeline {
  [key: string]: PipelineColumn;
}

export interface PipelineResponse {
  pipeline: Pipeline;
  totalOpportunities: number;
  totalValue: number;
}

export interface MovePipelineRequest {
  projectId: string;
  newStatus: ProjectStatus;
}

export interface MovePipelineResponse {
  success: boolean;
  project: Project;
  message?: string;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  activity_type: string;
  description: string;
  created_by: string;
  created_at: string;
  created_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateProjectRequest {
  project_name: string;
  description?: string;
  customer_id: string;
  contract_value?: number;
  estimated_value?: number;
  lead_score?: number;
  // defaulting new project to Prospect on creation
  status?: ProjectStatus;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  expected_close_date?: Date | null;
  notes?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  customer_id?: string;
  contract_value?: number;
  estimated_value?: number;
  lead_score?: number;
  status?: ProjectStatus;
  expected_close_date?: string;
}

// Pipeline Column Configuration
export const PIPELINE_COLUMNS = {
  [ProjectStatus.PROSPECT]: {
    title: "Prospect",
    color: "#2196F3",
    description: "Lead yang sudah dikualifikasi sebagai prospect",
  },
  [ProjectStatus.MEETING_SCHEDULED]: {
    title: "Meeting Scheduled",
    color: "#FF9800",
    description: "Meeting sudah dijadwalkan",
  },
  [ProjectStatus.PRE_SALES]: {
    title: "Pre-Sales",
    color: "#9C27B0",
    description: "Analisis kebutuhan dan solusi",
  },
  [ProjectStatus.PROPOSAL_DELIVERED]: {
    title: "Proposal Delivered",
    color: "#673AB7",
    description: "Proposal sudah dikirim ke client",
  },
  [ProjectStatus.WON]: {
    title: "Won",
    color: "#4CAF50",
    description: "Deal berhasil ditutup",
  },
  [ProjectStatus.LOST]: {
    title: "Lost",
    color: "#F44336",
    description: "Deal gagal atau dibatalkan",
  },
};

// Status yang aktif dalam pipeline (sesuai flow: Prospect → Meeting Scheduled → Pre-Sales → Proposal Delivered → WON/LOST)
export const ACTIVE_PIPELINE_STATUSES = [
  ProjectStatus.PROSPECT,
  ProjectStatus.MEETING_SCHEDULED,
  ProjectStatus.PRE_SALES,
  ProjectStatus.PROPOSAL_DELIVERED,
];

// Status akhir (WON dan LOST)
export const CLOSED_STATUSES = [ProjectStatus.WON, ProjectStatus.LOST];
