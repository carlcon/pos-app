import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Category } from '@/types';

export function useCategories(storeId?: number | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (storeId) params.append('store_id', storeId.toString());
      const response = await api.get(`/inventory/categories/${params.toString() ? `?${params.toString()}` : ''}`);
      const data = response.data as { results?: Category[] } | Category[];
      // Handle both paginated and non-paginated responses
      setCategories(Array.isArray(data) ? data : (data.results || []));
    } catch (err: unknown) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (data: Partial<Category>) => {
    const response = await api.post<Category>('/inventory/categories/', data);
    await fetchCategories();
    return response.data;
  };

  const updateCategory = async (id: number, data: Partial<Category>) => {
    const response = await api.put<Category>(`/inventory/categories/${id}/`, data);
    await fetchCategories();
    return response.data;
  };

  const deleteCategory = async (id: number) => {
    await api.delete(`/inventory/categories/${id}/`);
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
