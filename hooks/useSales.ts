import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Sale, PaginatedResponse } from '@/types';

interface CreateSaleData {
  customer_name?: string;
  payment_method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT';
  items: Array<{
    product: number;
    quantity: number;
    unit_price: string;
    discount?: string;
  }>;
  discount?: string;
  notes?: string;
  is_wholesale?: boolean;
  store?: number;
}

export function useSales(storeId?: number | null) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (storeId) params.append('store_id', storeId.toString());
      const response = await api.get<PaginatedResponse<Sale>>(`/sales/?${params.toString()}`);
      setSales(response.data.results);
      setTotalCount(response.data.count);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  }, [page, storeId]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const createSale = async (data: CreateSaleData) => {
    try {
      const payload = storeId ? { ...data, store: storeId } : data;
      const response = await api.post<Sale>('/sales/', payload);
      await fetchSales();
      return response.data;
    } catch (error) {
      // Re-throw the error so the calling component can handle it
      throw error;
    }
  };

  return {
    sales,
    loading,
    error,
    page,
    setPage,
    totalCount,
    refresh: fetchSales,
    createSale,
  };
}
