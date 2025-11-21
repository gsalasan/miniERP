/**
 * Event type definitions for miniERP Event Bus
 */

export interface BaseEventPayload {
  eventId: string;
  timestamp: Date;
  source: string; // service name
}

// Customer Events
export interface CustomerCreatedPayload extends BaseEventPayload {
  data: {
    customerId: string;
    customerName: string;
    channel: string;
    city: string;
    status: string;
    creditLimit?: number;
    noNpwp?: string;
    sppkp?: string;
  };
}

export interface CustomerUpdatedPayload extends BaseEventPayload {
  data: {
    customerId: string;
    customerName?: string;
    channel?: string;
    city?: string;
    status?: string;
    creditLimit?: number;
    noNpwp?: string;
    sppkp?: string;
    changes: Record<string, unknown>;
  };
}

// Project Events
export interface ProjectStatusChangedPayload extends BaseEventPayload {
  data: {
    projectId: string;
    projectName: string;
    customerId: string;
    previousStatus: string;
    newStatus: string;
    estimatedValue?: number;
    contractValue?: number;
  };
}

// Estimation Events
export interface EstimationApprovedPayload extends BaseEventPayload {
  data: {
    estimationId: string;
    projectId: string;
    projectName: string;
    approvedBy: string;
    approvedAt: Date;
    totalAmount: number;
  };
}

// Invoice Events
export interface InvoiceCreatedPayload extends BaseEventPayload {
  data: {
    invoiceId: string;
    invoiceNumber: string;
    customerId?: string;
    customerName: string;
    totalAmount: number;
    currency: string;
    status: string;
    invoiceDate: Date;
    dueDate: Date;
  };
}

// Union type for all event payloads
export type EventPayload =
  | CustomerCreatedPayload
  | CustomerUpdatedPayload
  | ProjectStatusChangedPayload
  | EstimationApprovedPayload
  | InvoiceCreatedPayload;

// Event name constants
export const EventNames = {
  CUSTOMER_CREATED: 'customer:created',
  CUSTOMER_UPDATED: 'customer:updated',
  PROJECT_STATUS_CHANGED: 'project:status:changed',
  ESTIMATION_APPROVED: 'estimation:approved',
  INVOICE_CREATED: 'invoice:created',
} as const;

export type EventName = typeof EventNames[keyof typeof EventNames];

