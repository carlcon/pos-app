import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Product, PaginatedResponse } from '@/types';

interface UseProductsOptions {
  search?: string;
  category?: number;
  lowStock?: boolean;
  isActive?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.search) params.append('search', options.search);
      if (options.category) params.append('category', options.category.toString());
      if (options.lowStock) params.append('low_stock', 'true');
      if (options.isActive !== undefined) params.append('is_active', options.isActive.toString());
      params.append('page', page.toString());

      const response = await api.get<PaginatedResponse<Product>>(`/inventory/products/?${params}`);
      setProducts(response.data.results);
      setTotalCount(response.data.count);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [options.search, options.category, options.lowStock, options.isActive, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (data: Partial<Product>) => {
    const response = await api.post<Product>('/inventory/products/', data);
    await fetchProducts();
    return response.data;
  };

  const updateProduct = async (id: number, data: Partial<Product>) => {
    const response = await api.put<Product>(`/inventory/products/${id}/`, data);
    await fetchProducts();
    return response.data;
  };

  const deleteProduct = async (id: number) => {
    await api.delete(`/inventory/products/${id}/`);
    await fetchProducts();
  };

  const lookupBarcode = async (barcode: string) => {
    const response = await api.get<Product>(`/inventory/products/barcode/${barcode}/`);
    return response.data;
  };

  return {
    products,
    loading,
    error,
    page,
    setPage,
    totalCount,
    refresh: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    lookupBarcode,
  };
}
