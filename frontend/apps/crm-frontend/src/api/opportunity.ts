import axios from "axios";
import { config, auth } from "../config";

const API_BASE_URL = config.CRM_SERVICE_URL;

// ==================== TYPES ====================

export interface PipelineStage {
  id: string;
  stage_name: string;
  stage_order: number;
  color?: string;
  description?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  opportunity_number?: string;
  title: string;
  customer_id?: string;
  customer?: {
    id: string;
    customer_name: string;
    city?: string;
    province?: string;
  };
  project_id?: string;
  project?: {
    id: string;
    project_name: string;
    status?: string;
  };
  sbu?: string;
  estimated_value?: number;
  probability?: number;
  stage?: string;
  sales_pic?: string;
  sales_pic_user?: {
    id: string;
    email: string;
    employee?: {
      full_name: string;
      position?: string;
      phone?: string;
    };
  };
  status?: string;
  description?: string;
  expected_close_date?: string;
  lead_score?: number;
  sales_order_id?: string;
  created_by?: string;
  created_by_user?: {
    id: string;
    email: string;
    employee?: {
      full_name: string;
    };
  };
  updated_by?: string;
  created_at: string;
  updated_at: string;
  sales_orders?: Array<{
    id: string;
    order_number?: string;
    status?: string;
    total_amount?: number;
  }>;
  sales_itineraries?: Array<{
    id: string;
    visit_date: string;
    status?: string;
    notes?: string;
  }>;
}

export interface CreateOpportunityData {
  title: string;
  customer_id: string;
  estimated_value?: number;
  probability?: number;
  stage?: string;
  sales_pic?: string;
  sbu?: string;
  description?: string;
  expected_close_date?: string;
  lead_score?: number;
}

export interface UpdateOpportunityData {
  title?: string;
  customer_id?: string;
  estimated_value?: number;
  probability?: number;
  stage?: string;
  sales_pic?: string;
  sbu?: string;
  description?: string;
  expected_close_date?: string;
  lead_score?: number;
  status?: string;
}

export interface MoveStageData {
  stage: string;
  probability?: number;
}

export interface PipelineSummary {
  total_opportunities: number;
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  per_stage_stats: Array<{
    stage_id: string;
    stage_name: string;
    stage_order: number;
    count: number;
    total_value: number;
    weighted_value: number;
  }>;
  status_stats: {
    open: number;
    won: number;
    lost: number;
  };
}

// ==================== API FUNCTIONS ====================

/**
 * Get pipeline stages
 */
export const getPipelineStages = async (): Promise<PipelineStage[]> => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.get(`${API_BASE_URL}/pipeline-stages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
};

/**
 * Create pipeline stage
 */
export const createPipelineStage = async (data: {
  stage_name: string;
  stage_order: number;
  color?: string;
  description?: string;
}) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.post(`${API_BASE_URL}/pipeline-stages`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Update pipeline stage
 */
export const updatePipelineStage = async (id: string, data: Partial<PipelineStage>) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.patch(`${API_BASE_URL}/pipeline-stages/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Delete pipeline stage
 */
export const deletePipelineStage = async (id: string) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.delete(`${API_BASE_URL}/pipeline-stages/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Get opportunities
 */
export const getOpportunities = async (params?: {
  stage?: string;
  sales_pic?: string;
  customer_id?: string;
  sbu?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  expected_close_from?: string;
  expected_close_to?: string;
}) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.get(`${API_BASE_URL}/opportunities`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Get opportunity by ID
 */
export const getOpportunityById = async (id: string): Promise<Opportunity> => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.get(`${API_BASE_URL}/opportunities/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
};

/**
 * Create opportunity
 */
export const createOpportunity = async (data: CreateOpportunityData) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.post(`${API_BASE_URL}/opportunities`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Update opportunity
 */
export const updateOpportunity = async (id: string, data: UpdateOpportunityData) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.patch(`${API_BASE_URL}/opportunities/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Move opportunity to different stage (drag & drop)
 */
export const moveOpportunityStage = async (id: string, data: MoveStageData) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.patch(`${API_BASE_URL}/opportunities/${id}/move-stage`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Convert opportunity to sales order
 */
export const convertOpportunity = async (id: string) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.post(
    `${API_BASE_URL}/opportunities/${id}/convert`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data;
};

/**
 * Delete opportunity
 */
export const deleteOpportunity = async (id: string) => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.delete(`${API_BASE_URL}/opportunities/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Get pipeline summary
 */
export const getPipelineSummary = async (params?: {
  sales_pic?: string;
  sbu?: string;
}): Promise<PipelineSummary> => {
  const token =
    localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  const response = await axios.get(`${API_BASE_URL}/opportunities/summary`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
};

export const opportunityApi = {
  getPipelineStages,
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  moveOpportunityStage,
  convertOpportunity,
  deleteOpportunity,
  getPipelineSummary,
};
