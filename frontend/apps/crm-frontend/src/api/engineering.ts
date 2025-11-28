import axios from "axios";
import { config, auth } from "../config";

export interface Estimation {
  id: string;
  project_id: string;
  version: number;
  status: 
    | "PENDING" 
    | "IN_PROGRESS" 
    | "APPROVED" 
    | "REJECTED" 
    | "DRAFT" 
    | "ARCHIVED"
    | "PENDING_DISCOUNT_APPROVAL"
    | "DISCOUNT_APPROVED"
    | "DISCOUNT_REJECTED";
  requested_by_user_id?: string | null;
  assigned_to_user_id?: string | null;
  technical_brief?: string | null;
  attachments?: string[] | null;
  requested_discount?: number | null;
  approved_discount?: number | null;
  discount_requested_at?: string | null;
  discount_approved_at?: string | null;
  discount_approved_by_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

const engineeringApi = axios.create({
  baseURL: config.ENGINEERING_SERVICE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

engineeringApi.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(auth.TOKEN_KEY) || localStorage.getItem(auth.LEGACY_TOKEN_KEY);
  if (token) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as any).Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export const estimationsApi = {
  async listByProject(projectId: string): Promise<Estimation[]> {
    const res = await engineeringApi.get(`/projects/${projectId}/estimations`);
    return res.data?.data || res.data || [];
  },
  async create(payload: {
    projectId: string;
    requestedByUserId?: string;
    assignedToUserId?: string;
    technicalBrief: string;
    attachmentUrls?: string[];
  }): Promise<Estimation> {
    const res = await engineeringApi.post("/estimations", payload);
    return res.data?.data || res.data;
  },
};

export default estimationsApi;
