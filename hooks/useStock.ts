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
}

export function useStock() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<PaginatedResponse<StockTransaction>>(`/stock/transactions/?page=${page}`);
      setTransactions(response.data.results);
      setTotalCount(response.data.count);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stock transactions');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createAdjustment = async (data: CreateStockAdjustment) => {
    const response = await api.post<StockTransaction>('/stock/adjust/', data);
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
