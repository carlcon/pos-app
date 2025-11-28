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
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<PaginatedResponse<Sale>>(`/sales/?page=${page}`);
      setSales(response.data.results);
      setTotalCount(response.data.count);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const createSale = async (data: CreateSaleData) => {
    try {
      const response = await api.post<Sale>('/sales/', data);
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
