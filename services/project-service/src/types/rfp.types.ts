export interface RfpItemDto {
  itemId: string;
  itemType: 'MATERIAL' | 'SERVICE';
  quantity: number;
}

export interface CreateRfpDto {
  items: RfpItemDto[];
  notes?: string;
}

export interface RfpItemResponse {
  id: string;
  rfpId: string;
  itemName: string;
  itemType: string;
  materialId?: string;
  serviceId?: string;
  quantity: number;
  unit?: string;
  notes?: string;
  createdAt: Date;
}

export interface RfpResponse {
  id: string;
  rfpNumber: string;
  projectId: string;
  projectName: string;
  requesterId: string;
  requesterName: string;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items: RfpItemResponse[];
}
