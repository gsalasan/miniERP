import { useState, useCallback } from 'react';
import axios from 'axios';
import {
  MaterialOption,
  searchMaterials,
  createMaterialWithInitialPrice,
  searchServices,
  ServiceOption,
} from '../engineeringApi';

const PROCUREMENT_API_BASE = import.meta.env.VITE_PROCUREMENT_API_BASE_URL || import.meta.env.VITE_PROCUREMENT_API_URL || '';

export const useMaterialsSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, category?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (category === 'service') {
        const results: ServiceOption[] = await searchServices(query);
        // normalize to common shape expected by UI
        return results.map((s) => ({ id: s.id, item_name: s.service_name, brand: s.service_code } as unknown as MaterialOption));
      }

      // default: material search
      const results: MaterialOption[] = await searchMaterials(query);
      return results;
    } catch (err: any) {
      setError(err.message || 'Gagal mencari material');
      return [] as MaterialOption[];
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, loading, error };
};

export const useCreateMaterial = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (payload: Parameters<typeof createMaterialWithInitialPrice>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const created = await createMaterialWithInitialPrice(payload as any);
      return created;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal membuat material');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
};

export const useCreateVendor = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (payload: { vendor_name: string; classification: string; category?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const base = PROCUREMENT_API_BASE || '';
      const res = await axios.post(`${base}/api/v1/vendors`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });
      return res.data?.data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Gagal membuat vendor');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
};

export default null;
