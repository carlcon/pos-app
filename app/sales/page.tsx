'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Card,
  CardBody,
  Chip,
  Select,
  SelectItem,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Pagination,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Divider,
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import type { Sale, SaleItem, PaginatedResponse, Store } from '@/types';

const PAYMENT_METHODS = [
  { key: '', label: 'All Methods' },
  { key: 'CASH', label: 'Cash' },
  { key: 'CARD', label: 'Card' },
  { key: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { key: 'CHECK', label: 'Check' },
];

const FILTER_STORAGE_KEY = 'pos_sales_filters';

function SalesHistoryContent() {
  const { effectiveStoreId, isPartnerAdmin, isImpersonatingStore } = useAuth();
  
  // Sales data
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  // Store list (for partner admins)
  const [stores, setStores] = useState<Store[]>([]);
  
  // Sale detail modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Load saved filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        setSearchQuery(filters.searchQuery || '');
        setDateFrom(filters.dateFrom || '');
        setDateTo(filters.dateTo || '');
        setPaymentMethod(filters.paymentMethod || '');
        setSelectedStoreId(filters.selectedStoreId || '');
      } catch {
        // Invalid saved filters, ignore
      }
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    const filters = { searchQuery, dateFrom, dateTo, paymentMethod, selectedStoreId };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  }, [searchQuery, dateFrom, dateTo, paymentMethod, selectedStoreId]);

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

  // Fetch sales on mount and when filters change
  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('page', page.toString());
        
        // Get effective store ID for filtering
        let storeId = '';
        if (effectiveStoreId) {
          storeId = effectiveStoreId.toString();
        } else if (selectedStoreId) {
          storeId = selectedStoreId;
        }
        
        if (storeId) params.append('store_id', storeId);
        if (searchQuery) params.append('search', searchQuery);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        if (paymentMethod) params.append('payment_method', paymentMethod);
        
        const response = await api.get<PaginatedResponse<Sale>>(`/sales/?${params.toString()}`);
        setSales(response.data.results);
        setTotalCount(response.data.count);
        setTotalPages(Math.ceil(response.data.count / 20));
      } catch (error) {
        console.error('Failed to fetch sales:', error);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadSales();
  }, [page, searchQuery, dateFrom, dateTo, paymentMethod, effectiveStoreId, selectedStoreId]);

  // Fetch sale items when viewing details
  const handleViewSale = async (sale: Sale) => {
    setSelectedSale(sale);
    onOpen();
    
    try {
      setLoadingItems(true);
      const response = await api.get<Sale>(`/sales/${sale.id}/`);
      setSaleItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch sale items:', error);
      setSaleItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setPaymentMethod('');
    setSelectedStoreId('');
    setPage(1);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Payment method color
  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'CASH': return 'success';
      case 'CARD': return 'primary';
      case 'BANK_TRANSFER': return 'secondary';
      case 'CHECK': return 'warning';
      default: return 'default';
    }
  };

  // Show store filter for partner admins who are not impersonating a store
  const showStoreFilter = isPartnerAdmin && !isImpersonatingStore && !effectiveStoreId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Sales History</h1>
            <p className="text-sm text-default-500 mt-1">
              View and manage past transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Chip color="default" variant="flat">
              Total: {totalCount} sales
            </Chip>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                placeholder="Search by sale # or customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                size="sm"
                startContent={<span>🔍</span>}
              />
              
              <Input
                type="date"
                label="From Date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                size="sm"
              />
              
              <Input
                type="date"
                label="To Date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                size="sm"
              />
              
              <Select
                placeholder="Payment Method"
                selectedKeys={paymentMethod ? new Set([paymentMethod]) : new Set()}
                onSelectionChange={(keys) => {
                  setPaymentMethod(Array.from(keys)[0] as string || '');
                  setPage(1);
                }}
                size="sm"
              >
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.key}>{method.label}</SelectItem>
                ))}
              </Select>
              
              {showStoreFilter ? (
                <Select
                  placeholder="All Stores"
                  selectedKeys={selectedStoreId ? new Set([selectedStoreId]) : new Set()}
                  onSelectionChange={(keys) => {
                    setSelectedStoreId(Array.from(keys)[0] as string || '');
                    setPage(1);
                  }}
                  size="sm"
                >
                  {[
                    <SelectItem key="">All Stores</SelectItem>,
                    ...stores.map((store) => (
                      <SelectItem key={store.id.toString()}>{store.name}</SelectItem>
                    ))
                  ]}
                </Select>
              ) : (
                <Button
                  variant="flat"
                  size="sm"
                  onPress={handleClearFilters}
                  className="h-full"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            
            {showStoreFilter && (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="flat"
                  size="sm"
                  onPress={handleClearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner size="lg" />
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12 text-default-400">
                <span className="text-4xl mb-3 block">📋</span>
                <p className="text-lg font-medium">No sales found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <Table aria-label="Sales history table" removeWrapper>
                  <TableHeader>
                    <TableColumn>Sale #</TableColumn>
                    <TableColumn>Date</TableColumn>
                    <TableColumn>Customer</TableColumn>
                    <TableColumn>Items</TableColumn>
                    <TableColumn>Payment</TableColumn>
                    <TableColumn>Total</TableColumn>
                    <TableColumn>Actions</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <span className="font-mono font-medium">{sale.sale_number}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(sale.created_at)}</span>
                        </TableCell>
                        <TableCell>
                          {sale.customer_name || <span className="text-default-400">Walk-in</span>}
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" variant="flat">
                            {sale.items?.length || '?'} items
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            color={getPaymentMethodColor(sale.payment_method)}
                            variant="flat"
                          >
                            {sale.payment_method}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            ₱{parseFloat(sale.total_amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => handleViewSale(sale)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="flex justify-center py-4 border-t">
                    <Pagination
                      total={totalPages}
                      page={page}
                      onChange={setPage}
                      showControls
                      size="sm"
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Sale Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <span>Sale Details</span>
              <Chip size="sm" color="primary" variant="flat">
                {selectedSale?.sale_number}
              </Chip>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedSale && (
              <div className="space-y-4">
                {/* Sale Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-default-50 rounded-lg">
                  <div>
                    <p className="text-sm text-default-500">Date</p>
                    <p className="font-medium">{formatDate(selectedSale.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Customer</p>
                    <p className="font-medium">{selectedSale.customer_name || 'Walk-in'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Payment Method</p>
                    <Chip size="sm" color={getPaymentMethodColor(selectedSale.payment_method)} variant="flat">
                      {selectedSale.payment_method}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Cashier</p>
                    <p className="font-medium">{selectedSale.cashier_username || 'N/A'}</p>
                  </div>
                </div>

                <Divider />

                {/* Items */}
                <div>
                  <h4 className="font-semibold mb-3">Items</h4>
                  {loadingItems ? (
                    <div className="flex justify-center py-4">
                      <Spinner size="sm" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {saleItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-default-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name || `Product #${item.product}`}</p>
                            <p className="text-sm text-default-500">
                              ₱{parseFloat(item.unit_price).toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                          <div className="font-semibold">
                            ₱{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Divider />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-default-500">Subtotal</span>
                    <span>₱{parseFloat(selectedSale.subtotal || selectedSale.total_amount).toFixed(2)}</span>
                  </div>
                  {selectedSale.discount && parseFloat(selectedSale.discount) > 0 && (
                    <div className="flex justify-between text-danger">
                      <span>Discount</span>
                      <span>-₱{parseFloat(selectedSale.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>₱{parseFloat(selectedSale.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default function SalesHistoryPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'STORE_ADMIN', 'CASHIER']}>
      <SalesHistoryContent />
    </ProtectedRoute>
  );
}
