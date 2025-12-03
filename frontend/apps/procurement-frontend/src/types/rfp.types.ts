export enum RFPStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PO_CREATED = 'PO_CREATED',
  COMPLETED = 'COMPLETED',
}

export enum POStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SENT_TO_VENDOR = 'SENT_TO_VENDOR',
  CONFIRMED = 'CONFIRMED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface RFPItem {
  id: string;
  rfpId: string;
  materialId?: string;
  serviceId?: string;
  itemName: string;
  itemType: 'MATERIAL' | 'SERVICE';
  quantity: number;
  unit: string;
  estimatedPrice?: number;
  notes?: string;
  material?: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  service?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface RFP {
  id: string;
  rfpNumber: string;
  projectId: string;
  requesterId: string;
  status: RFPStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    projectName: string;
    projectCode: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  items: RFPItem[];
  _count?: {
    items: number;
  };
}

export interface RFPListResponse {
  rfps: RFP[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RFPQueryParams {
  page?: number;
  limit?: number;
  status?: RFPStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatePOFromRFPPayload {
  rfpId: string;
  vendorId: string;
  items: {
    rfpItemId: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }[];
  notes?: string;
  expectedDeliveryDate?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  rfpId?: string;
  vendorId: string;
  projectId?: string;
  status: POStatus;
  totalAmount: number;
  notes?: string;
  expectedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  vendor: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    projectName: string;
    projectCode: string;
  };
}
