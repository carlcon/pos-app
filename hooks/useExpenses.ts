import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface ExpenseCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  expense_count: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  title: string;
  description: string;
  amount: string;
  category: number | null;
  category_name: string | null;
  category_color: string | null;
  payment_method: 'CASH' | 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CHECK' | 'OTHER';
  payment_method_display: string;
  expense_date: string;
  receipt_number: string;
  vendor: string;
  notes: string;
  created_by: number;
  created_by_username: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseStats {
  total_expenses: number;
  total_count: number;
  this_month_total: number;
  last_month_total: number;
  today_total: number;
  today_count: number;
  by_category: Array<{
    category__name: string | null;
    category__color: string | null;
    total: number;
    count: number;
  }>;
  by_payment_method: Array<{
    payment_method: string;
    total: number;
    count: number;
  }>;
  monthly_trend: Array<{
    month: string;
    total: number;
  }>;
}

interface CreateExpense {
  title: string;
  description?: string;
  amount: number;
  category?: number;
  payment_method: string;
  expense_date: string;
  receipt_number?: string;
  vendor?: string;
  notes?: string;
}

interface ExpenseFilters {
  category?: number;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<ExpenseFilters>({});

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      
      if (filters.category) params.append('category', filters.category.toString());
      if (filters.payment_method) params.append('payment_method', filters.payment_method);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get<PaginatedResponse<Expense>>(`/expenses/?${params.toString()}`);
      setExpenses(response.data.results);
      setTotalCount(response.data.count);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = async (data: CreateExpense) => {
    const response = await api.post<Expense>('/expenses/', data);
    await fetchExpenses();
    return response.data;
  };

  const updateExpense = async (id: number, data: Partial<CreateExpense>) => {
    const response = await api.patch<Expense>(`/expenses/${id}/`, data);
    await fetchExpenses();
    return response.data;
  };

  const deleteExpense = async (id: number) => {
    await api.delete(`/expenses/${id}/`);
    await fetchExpenses();
  };

  return {
    expenses,
    loading,
    error,
    page,
    setPage,
    totalCount,
    filters,
    setFilters,
    refresh: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}

export function useExpenseCategories() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<PaginatedResponse<ExpenseCategory>>('/expenses/categories/');
      setCategories(response.data.results);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (data: { name: string; description?: string; color?: string }) => {
    const response = await api.post<ExpenseCategory>('/expenses/categories/', data);
    await fetchCategories();
    return response.data;
  };

  const updateCategory = async (id: number, data: Partial<{ name: string; description: string; color: string; is_active: boolean }>) => {
    const response = await api.patch<ExpenseCategory>(`/expenses/categories/${id}/`, data);
    await fetchCategories();
    return response.data;
  };

  const deleteCategory = async (id: number) => {
    await api.delete(`/expenses/categories/${id}/`);
    await fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    refresh: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export function useExpenseStats() {
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ExpenseStats>('/expenses/stats/');
      setStats(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch expense stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
