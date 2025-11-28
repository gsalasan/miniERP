import axios from 'axios';

const ENGINEERING_SERVICE_URL = import.meta.env.VITE_ENGINEERING_SERVICE_URL || 'http://localhost:4001';

const engineeringClient = axios.create({
  baseURL: ENGINEERING_SERVICE_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

engineeringClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper: try multiple candidate hosts when an endpoint is unavailable due to misconfigured env/dev server
const candidateHosts: string[] = [
  import.meta.env.VITE_ENGINEERING_SERVICE_URL || '',
  'http://localhost:4001',
  'http://localhost:4006',
  'http://localhost:8080',
].filter(Boolean);

export interface MaterialOption {
  id: string;
  item_name: string;
  brand?: string;
  owner_pn?: string;
  vendor?: string;
}

export interface ServiceOption {
  id: string;
  service_name: string;
  service_code: string;
}

export const searchMaterials = async (query: string): Promise<MaterialOption[]> => {
  // First try the configured engineering client
  try {
    const res = await engineeringClient.get('/materials/search', { params: { q: query, search: query } });
    return res.data?.data ?? res.data ?? [];
  } catch (e: any) {
    // If main client fails, try a short list of fallbacks and log attempts to console for debugging
    for (const host of candidateHosts) {
      try {
        const url = `${host.replace(/\/+$/, '')}/api/v1/materials/search`;
        // eslint-disable-next-line no-console
        console.debug('[engineeringApi] trying fallback host', url);
        const res2 = await axios.get(url, { params: { q: query, search: query }, headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
        return res2.data?.data ?? res2.data ?? [];
      } catch (err) {
        // eslint-disable-next-line no-console
        console.debug('[engineeringApi] fallback failed for host', host, err?.message || err);
      }
    }

    // final fallback: call /materials list endpoint on primary host
    try {
      const url = `${ENGINEERING_SERVICE_URL.replace(/\/+$/, '')}/api/v1/materials`;
      // eslint-disable-next-line no-console
      console.debug('[engineeringApi] trying final fallback', url);
      const res3 = await axios.get(url, { params: { search: query, q: query }, headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
      return res3.data?.data ?? res3.data ?? [];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.debug('[engineeringApi] final fallback failed', err?.message || err);
    }

    return [];
  }
};

export const getMaterials = async (params: { search?: string; category?: string; page?: number; limit?: number } = {}) => {
  const res = await engineeringClient.get('/materials', { params });
  return res.data?.data || [];
};

export const searchServices = async (query: string): Promise<ServiceOption[]> => {
  const res = await engineeringClient.get('/services/search', { params: { q: query, query } });
  // controller may return [] or an array of services directly, normalize both shapes
  return res.data?.data ?? res.data ?? [];
};

export interface CreateMaterialPayload {
  item_name: string;
  satuan?: string;
  brand?: string;
  vendor?: string;
}

export const createMaterial = async (payload: CreateMaterialPayload) => {
  const res = await engineeringClient.post('/materials', payload);
  return res.data?.data || res.data;
};

export interface CreateMaterialWithPricePayload {
  itemName: string;
  pn?: string;
  category?: string;
  unit?: string;
  initialPrice?: {
    vendorName: string;
    price: number;
    currency: string;
    exchangeRate?: number;
  };
}

export const createMaterialWithInitialPrice = async (payload: CreateMaterialWithPricePayload) => {
  const body = {
    item_name: payload.itemName,
    pn: payload.pn,
    category: payload.category,
    satuan: payload.unit,
    initialPrice: payload.initialPrice,
  };
  const res = await engineeringClient.post('/materials', body);
  return res.data?.data || res.data;
};
