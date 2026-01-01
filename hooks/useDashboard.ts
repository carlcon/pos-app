import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface DashboardStats {
  today_sales: {
    total: string;
    count: number;
    change_percentage: number;
  };
  low_stock_items: {
    count: number;
    items: Array<{
      id: number;
      name: string;
      sku: string;
      current_stock: number;
      minimum_stock_level: number;
    }>;
  };
  total_inventory_value: {
    value: string;
    change_percentage: number;
  };
  top_selling_products: Array<{
    id: number;
    name: string;
    sku: string;
    total_sold: number;
    revenue: string;
  }>;
  sales_by_payment_method: Array<{
    payment_method: string;
    total: string;
    count: number;
  }>;
  recent_sales: Array<{
    id: number;
    sale_number: string;
    total_amount: string;
    customer_name?: string;
    created_at: string;
    cashier_username: string;
  }>;
  weekly_sales: Array<{
    date: string;
    total: number;
    count: number;
  }>;
  monthly_revenue: Array<{
    month: string;
    revenue: number;
  }>;
  stock_summary: {
    total_products: number;
    active_products: number;
    low_stock_count: number;
    out_of_stock_count: number;
  };
}

export function useDashboard(enabled = true, storeId?: number | null) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!enabled) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (storeId) params.append('store_id', storeId.toString());
      const response = await api.get<DashboardStats>(`/dashboard/stats/${params.toString() ? `?${params.toString()}` : ''}`);
      setStats(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [enabled, storeId]);

  useEffect(() => {
    if (!enabled) {
      setStats(null);
      setLoading(false);
      return;
    }

    fetchDashboard();
  }, [enabled, fetchDashboard]);

  return {
    stats,
    loading,
    error,
    refresh: fetchDashboard,
  };
}
