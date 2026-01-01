'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  Button,
  Input,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  addToast,
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useCategories } from '@/hooks/useCategories';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import type { Product, Store } from '@/types';
import api from '@/lib/api';

function ProductsContent() {
  const { effectiveStoreId, isPartnerAdmin, isImpersonatingStore } = useAuth();
  const { selectedStoreId } = useStore();
  const { categories, loading: categoriesLoading } = useCategories(selectedStoreId);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    description: '',
    cost_price: '',
    selling_price: '',
    wholesale_price: '',
    unit_of_measure: 'PIECE',
    is_active: true,
  });

  // Fetch stores for partner admins
  useEffect(() => {
    const fetchStores = async () => {
      if (!isPartnerAdmin || isImpersonatingStore) return;
      
      try {
        const response = await api.get<{ results: Store[] }>('/stores/');
        setStores(response.data.results);
      } catch (error) {
        console.error('Failed to fetch stores:', error);
      }
    };
    
    fetchStores();
  }, [isPartnerAdmin, isImpersonatingStore]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      
      // Determine which store to filter by
      let filterStoreId = '';
      if (effectiveStoreId) {
        // Store-level user or impersonating store
        filterStoreId = effectiveStoreId.toString();
      } else if (storeFilter && storeFilter !== 'all') {
        // Partner admin filtering by specific store
        filterStoreId = storeFilter;
      }
      
      if (filterStoreId) params.append('store_id', filterStoreId);
      const response = await api.get(`/inventory/products/${params.toString() ? `?${params.toString()}` : ''}`);
      const data = response.data as { results?: Product[] } | Product[];
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveStoreId, storeFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products based on all filters
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product) => {
      // Global search filter
      const matchesSearch = !globalFilter || 
        product.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        product.sku.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (product.barcode && product.barcode.toLowerCase().includes(globalFilter.toLowerCase()));

      // Category filter
      const matchesCategory = categoryFilter === 'all' || 
        product.category.toString() === categoryFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && product.is_active) ||
        (statusFilter === 'inactive' && !product.is_active);

      // Stock filter
      const matchesStock = stockFilter === 'all' ||
        (stockFilter === 'low' && product.current_stock <= product.minimum_stock_level) ||
        (stockFilter === 'out' && product.current_stock === 0) ||
        (stockFilter === 'in' && product.current_stock > product.minimum_stock_level);

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });
  }, [products, globalFilter, categoryFilter, statusFilter, stockFilter]);

  // Define handlers with useCallback before columns so they can be used in the dependency array
  const handleEdit = useCallback((product: Product) => {
    console.log('Edit clicked for product:', product);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: product.category.toString(),
      description: product.description || '',
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      wholesale_price: product.wholesale_price || '',
      unit_of_measure: product.unit_of_measure,
      is_active: product.is_active,
    });
    onOpen();
  }, [onOpen]);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'barcode',
        header: 'Barcode',
        cell: ({ row }) => (
          <code className="text-xs bg-[#049AE0]/10 text-[#049AE0] px-3 py-1.5 rounded-md font-mono">
            {row.original.barcode || 'N/A'}
          </code>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Product Name',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-[#242832]">{row.original.name}</p>
            <p className="text-xs text-default-500 mt-0.5">{row.original.sku}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category_name',
        header: 'Category',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {row.original.category_name}
          </span>
        ),
      },
      {
        accessorKey: 'selling_price',
        header: 'Retail Price',
        cell: ({ row }) => (
          <span className="font-semibold text-[#242832]">
            ₱{parseFloat(row.original.selling_price).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'wholesale_price',
        header: 'Wholesale Price',
        cell: ({ row }) => (
          <span className="font-semibold text-[#242832]">
            {row.original.wholesale_price 
              ? `₱${parseFloat(row.original.wholesale_price).toFixed(2)}`
              : <span className="text-default-400">—</span>
            }
          </span>
        ),
      },
      {
        accessorKey: 'current_stock',
        header: 'Stock',
        cell: ({ row }) => {
          const stock = row.original.current_stock;
          const reorder = row.original.minimum_stock_level;
          const color = stock === 0 ? 'bg-red-100 text-red-700' : stock <= reorder ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
          return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
              {stock}
            </span>
          );
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            row.original.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={() => handleEdit(row.original)}
            className="px-4 py-2 text-sm font-medium text-[#049AE0] bg-white border border-[#049AE0] rounded-lg hover:bg-[#049AE0] hover:text-white transition-colors duration-200"
          >
            Edit
          </button>
        ),
      },
    ],
    [handleEdit]
  );

  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: '',
      description: '',
      cost_price: '',
      selling_price: '',
      wholesale_price: '',
      unit_of_measure: 'PIECE',
      is_active: true,
    });
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      setError(null); // Clear previous errors
      
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.category || !formData.cost_price || !formData.selling_price) {
        setError('Please fill in all required fields');
        addToast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          color: 'warning',
        });
        return;
      }

      const data = {
        ...formData,
        category: parseInt(formData.category),
        barcode: formData.barcode || null,
        description: formData.description || '',
        wholesale_price: formData.wholesale_price || null,
      };

      console.log('Submitting product data:', data);

      if (editingProduct) {
        const response = await api.put(`/inventory/products/${editingProduct.id}/`, data);
        console.log('Update response:', response.data);
        addToast({
          title: 'Product Updated',
          description: `"${formData.name}" has been successfully updated.`,
          color: 'success',
        });
      } else {
        const response = await api.post('/inventory/products/', data);
        console.log('Create response:', response.data);
        addToast({
          title: 'Product Created',
          description: `"${formData.name}" has been successfully added.`,
          color: 'success',
        });
      }
      
      await fetchProducts();
      onClose();
      setError(null);
    } catch (err) {
      console.error('Product save error:', err);
      const error = err as { response?: { data?: { message?: string; detail?: string } } };
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail ||
                          JSON.stringify(error.response?.data) ||
                          'Failed to save product';
      setError(errorMessage);
      addToast({
        title: editingProduct ? 'Update Failed' : 'Create Failed',
        description: errorMessage,
        color: 'danger',
      });
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Spinner size="lg" color="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navbar />
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12 space-y-4 sm:space-y-6 xl:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#242832]">Products</h1>
            <p className="text-sm sm:text-base xl:text-lg text-default-500 mt-1">Manage your inventory items</p>
          </div>
          <Button 
            className="bg-[#049AE0] text-white font-semibold px-6 h-11 w-full sm:w-auto" 
            onPress={handleCreate}
          >
            + Add Product
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 xl:p-8">
          <h3 className="text-xs sm:text-sm xl:text-base font-semibold text-[#049AE0] uppercase tracking-wide mb-3 sm:mb-4 xl:mb-6">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 xl:gap-6">
            <Input
              placeholder="Search products..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full"
              classNames={{
                input: "text-sm focus:!outline-none",
                inputWrapper: "bg-white border border-gray-200 hover:border-[#049AE0] focus-within:!border-[#049AE0] shadow-sm"
              }}
            />
            {isPartnerAdmin && !isImpersonatingStore && !effectiveStoreId && (
              <Select
                placeholder="All Stores"
                selectedKeys={[storeFilter]}
                onChange={(e) => setStoreFilter(e.target.value)}
                className="w-full"
                classNames={{
                  trigger: "bg-white border border-gray-200 hover:border-[#049AE0] data-[hover=true]:bg-white shadow-sm",
                  value: "text-sm"
                }}
              >
                {[
                  <SelectItem key="all">All Stores</SelectItem>,
                  ...stores.map((store) => (
                    <SelectItem key={store.id.toString()}>{store.name}</SelectItem>
                  ))
                ]}
              </Select>
            )}
            <Select
              placeholder="Category"
              selectedKeys={[categoryFilter]}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full"
              classNames={{
                trigger: "bg-white border border-gray-200 hover:border-[#049AE0] data-[hover=true]:bg-white shadow-sm",
                value: "text-sm"
              }}
            >
              {[<SelectItem key="all">All Categories</SelectItem>].concat(
                categories?.map((cat) => (
                  <SelectItem key={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                )) || []
              )}
            </Select>
            <Select
              placeholder="Status"
              selectedKeys={[statusFilter]}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full"
              classNames={{
                trigger: "bg-white border border-gray-200 hover:border-[#049AE0] data-[hover=true]:bg-white shadow-sm",
                value: "text-sm"
              }}
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="active">Active</SelectItem>
              <SelectItem key="inactive">Inactive</SelectItem>
            </Select>
            <Select
              placeholder="Stock Level"
              selectedKeys={[stockFilter]}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full"
              classNames={{
                trigger: "bg-white border border-gray-200 hover:border-[#049AE0] data-[hover=true]:bg-white shadow-sm",
                value: "text-sm"
              }}
            >
              <SelectItem key="all">All Stock</SelectItem>
              <SelectItem key="in">In Stock</SelectItem>
              <SelectItem key="low">Low Stock</SelectItem>
              <SelectItem key="out">Out of Stock</SelectItem>
            </Select>
          </div>
          {(globalFilter || storeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || stockFilter !== 'all') && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setGlobalFilter('');
                  setStoreFilter('all');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setStockFilter('all');
                }}
                className="px-4 py-2 text-sm font-medium text-[#049AE0] bg-[#049AE0]/5 border border-[#049AE0]/20 rounded-lg hover:bg-[#049AE0]/10 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 sm:px-6 xl:px-8 py-3 sm:py-4 xl:py-5 text-left text-xs sm:text-sm font-semibold text-[#242832] uppercase tracking-wider"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 sm:px-6 xl:px-8 py-3 sm:py-4 xl:py-5 text-xs sm:text-sm xl:text-base">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 xl:px-8 py-4 xl:py-5 border-t border-gray-200 bg-gray-50">
            <div className="text-xs sm:text-sm xl:text-base text-default-600">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredProducts.length
              )}{' '}
              of {filteredProducts.length} products
              {filteredProducts.length !== products.length && (
                <span className="text-[#049AE0] font-medium"> (filtered from {products.length})</span>
              )}
            </div>
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <span className="text-xs sm:text-sm text-default-600">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#242832] bg-white border border-gray-300 rounded-lg hover:border-[#049AE0] hover:text-[#049AE0] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-[#242832] transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-[#242832] bg-white border border-gray-300 rounded-lg hover:border-[#049AE0] hover:text-[#049AE0] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-[#242832] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <Modal 
          isOpen={isOpen} 
          onClose={onClose} 
          size="3xl" 
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader className="text-xl font-bold text-[#242832] border-b pb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </ModalHeader>
            <ModalBody className="py-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  isRequired
                  placeholder="Enter product name"
                  classNames={{
                    inputWrapper: "border-gray-200 hover:border-[#049AE0]"
                  }}
                />
                <Input
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  isRequired
                  placeholder="Stock Keeping Unit"
                  classNames={{
                    inputWrapper: "border-gray-200 hover:border-[#049AE0]"
                  }}
                />
                <Input
                  label="Barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Scan or enter barcode"
                  classNames={{
                    inputWrapper: "border-gray-200 hover:border-[#049AE0]"
                  }}
                />
                <Select
                  label="Category"
                  selectedKeys={formData.category ? [formData.category] : []}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  isRequired
                  isDisabled={categoriesLoading}
                  classNames={{
                    trigger: "bg-white border border-gray-200 hover:border-[#049AE0]"
                  }}
                >
                  {categories && categories.length > 0 ? (
                    categories.map((cat) => (
                      <SelectItem key={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem key="loading">Loading categories...</SelectItem>
                  )}
                </Select>
                <Input
                  label="Cost Price"
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  startContent={<span className="text-default-400">₱</span>}
                  isRequired
                  placeholder="0.00"
                  classNames={{
                    inputWrapper: "border-gray-200 hover:border-[#049AE0]"
                  }}
                />
                <Input
                  label="Selling Price"
                  type="number"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  startContent={<span className="text-default-400">₱</span>}
                  isRequired
                  placeholder="0.00"
                  classNames={{
                    inputWrapper: "border-gray-200 hover:border-[#049AE0]"
                  }}
                />
                <Input
                  label="Wholesale Price"
                  type="number"
                  value={formData.wholesale_price}
                  onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                  startContent={<span className="text-default-400">₱</span>}
                  placeholder="0.00 (optional)"
                  classNames={{
                    inputWrapper: "border-gray-200 hover:border-[#049AE0]"
                  }}
                />
                <Select
                  label="Unit of Measure"
                  selectedKeys={[formData.unit_of_measure]}
                  onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                  isRequired
                >
                  <SelectItem key="PIECE">Piece</SelectItem>
                  <SelectItem key="BOX">Box</SelectItem>
                  <SelectItem key="SET">Set</SelectItem>
                  <SelectItem key="PAIR">Pair</SelectItem>
                  <SelectItem key="LITER">Liter</SelectItem>
                  <SelectItem key="KG">Kilogram</SelectItem>
                  <SelectItem key="METER">Meter</SelectItem>
                </Select>
                <div className="md:col-span-2">
                  <Input
                    label="Description (Optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description or notes"
                    classNames={{
                      inputWrapper: "border-gray-200 hover:border-[#049AE0]"
                    }}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="border-t pt-4">
              <Button 
                variant="flat" 
                onPress={onClose}
                className="border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button 
                className="bg-[#049AE0] text-white font-semibold hover:bg-[#0388c9]"
                onPress={handleSubmit}
              >
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <ProductsContent />
    </ProtectedRoute>
  );
}
