import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { StockTransaction, PaginatedResponse } from '@/types';

interface CreateStockAdjustment {
  product_id: number;
  adjustment_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  reason: 'PURCHASE' | 'SALE' | 'DAMAGED' | 'LOST' | 'RECONCILIATION' | 'RETURN' | 'MANUAL';
  quantity: number;
  unit_cost?: number;
  reference_number?: string;
  notes?: string;
  store?: number;
}

export function useStock(storeId?: number | null) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (storeId) params.append('store_id', storeId.toString());
      const response = await api.get<PaginatedResponse<StockTransaction>>(`/stock/transactions/?${params.toString()}`);
      setTransactions(response.data.results);
      setTotalCount(response.data.count);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch stock transactions');
    } finally {
      setLoading(false);
    }
  }, [page, storeId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createAdjustment = async (data: CreateStockAdjustment) => {
    const payload = storeId ? { ...data, store: storeId } : data;
    const response = await api.post<StockTransaction>('/stock/adjust/', payload);
    await fetchTransactions();
    return response.data;
  };

  return {
    transactions,
    loading,
    error,
    page,
    setPage,
    totalCount,
    refresh: fetchTransactions,
    createAdjustment,
  };
}
