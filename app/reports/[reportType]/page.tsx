'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  Button,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Divider,
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportTable } from '@/components/reports/ReportTable';
import { ReportExport } from '@/components/reports/ReportExport';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import type { PaginatedReportData, ReportFilters as Filters, Store } from '@/types';

const REPORT_NAMES: Record<string, string> = {
  'daily-sales': 'Daily Sales Report',
  'weekly-sales': 'Weekly Sales Summary',
  'monthly-revenue': 'Monthly Revenue Analysis',
  'payment-breakdown': 'Payment Method Breakdown',
  'stock-levels': 'Stock Levels Report',
  'low-stock': 'Low Stock Alert Report',
  'stock-movement': 'Stock Movement History',
  'inventory-valuation': 'Inventory Valuation',
  'top-selling': 'Top Selling Products',
  'products-by-category': 'Products by Category',
  'monthly-expenses': 'Monthly Expenses Analysis',
  'expenses-by-category': 'Expenses by Category',
  'expenses-by-vendor': 'Expenses by Vendor',
  'expense-transactions': 'Expense Transactions',
};

const DEFAULT_FILTERS: Record<string, Partial<Filters>> = {
  'daily-sales': { date: new Date().toISOString().split('T')[0], page_size: 10 },
  'weekly-sales': { page_size: 10 },
  'monthly-revenue': { page_size: 10 },
  'payment-breakdown': { period: 'today', page_size: 10 },
  'stock-levels': { page_size: 10 },
  'low-stock': { page_size: 10 },
  'stock-movement': { days: 30, page_size: 10 },
  'inventory-valuation': { page_size: 10 },
  'top-selling': { days: 30, limit: 20, page_size: 10 },
  'products-by-category': { page_size: 10 },
  'monthly-expenses': { page_size: 10 },
  'expenses-by-category': { days: 30, page_size: 10 },
  'expenses-by-vendor': { days: 30, page_size: 10 },
  'expense-transactions': { days: 30, page_size: 10 },
};

function ReportViewerContent() {
  const params = useParams();
  const router = useRouter();
  const { effectiveStoreId, isPartnerAdmin, isImpersonatingStore } = useAuth();
  const reportType = params.reportType as string;
  const reportName = REPORT_NAMES[reportType] || 'Unknown Report';

  const [reportData, setReportData] = useState<PaginatedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    page_size: 10,
    ...(DEFAULT_FILTERS[reportType] || {}),
  });
  const [stores, setStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  // Load filters from localStorage
  useEffect(() => {
    const storageKey = `report_filters_${reportType}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const savedFilters = JSON.parse(saved);
        setFilters(prev => ({ ...prev, ...savedFilters, page: 1 }));
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }
  }, [reportType]);

  // Save filters to localStorage
  useEffect(() => {
    const storageKey = `report_filters_${reportType}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page: _page, page_size: _pageSize, ...filtersToSave } = filters;
    localStorage.setItem(storageKey, JSON.stringify(filtersToSave));
  }, [filters, reportType]);

  // Fetch stores for partner admins
  useEffect(() => {
    if (isPartnerAdmin && !isImpersonatingStore) {
      api.get<{ results: Store[] }>('/stores/')
        .then(res => setStores(res.data.results))
        .catch(console.error);
    }
  }, [isPartnerAdmin, isImpersonatingStore]);

  // Fetch categories
  useEffect(() => {
    api.get<{ results: Array<{ id: number; name: string }> }>('/inventory/categories/')
      .then(res => setCategories(res.data.results))
      .catch(console.error);
  }, []);

  // Fetch report data
  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, filters.page, filters.page_size]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      // Add effective store if available
      if (effectiveStoreId && !filters.store_id) {
        params.append('store_id', String(effectiveStoreId));
      }

      const response = await api.get<PaginatedReportData>(
        `/dashboard/reports/${reportType}/?${params.toString()}`
      );
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      page_size: 10,
      ...(DEFAULT_FILTERS[reportType] || {}),
    });
  };

  const handleApplyFilters = () => {
    fetchReportData();
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters(prev => ({ ...prev, page_size: pageSize, page: 1 }));
  };

  if (!REPORT_NAMES[reportType]) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-danger">Invalid Report Type</h1>
          <Button className="mt-4" onPress={() => router.push('/reports')}>
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              size="sm"
              variant="light"
              onPress={() => router.push('/reports')}
              className="mb-2"
            >
              ← Back to Reports
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{reportName}</h1>
            {reportData && (
              <p className="text-sm text-default-500 mt-1">
                {reportData.generated_at && `Generated at ${new Date(reportData.generated_at).toLocaleString()}`}
                {reportData.period && ` • ${reportData.period}`}
              </p>
            )}
          </div>
          {reportData && (
            <ReportExport
              reportType={reportType}
              reportName={reportName}
              filters={filters}
            />
          )}
        </div>

        {/* Summary Cards */}
        {reportData?.summary && (
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {Object.entries(reportData.summary).map(([key, value]) => (
                  <div key={key} className="bg-default-50 rounded-lg p-4">
                    <p className="text-xs text-default-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-lg font-bold mt-1">
                      {typeof value === 'number' && key.toLowerCase().includes('revenue') || 
                       key.toLowerCase().includes('cost') || 
                       key.toLowerCase().includes('value') ||
                       key.toLowerCase().includes('expense')
                        ? `₱${parseFloat(String(value)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : key.toLowerCase().includes('percentage') || key.toLowerCase().includes('margin')
                        ? `${parseFloat(String(value)).toFixed(2)}%`
                        : typeof value === 'number'
                        ? parseFloat(String(value)).toLocaleString('en-US')
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardBody className="p-6">
            <ReportFilters
              reportType={reportType}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              stores={stores}
              categories={categories}
              showStoreFilter={isPartnerAdmin && !isImpersonatingStore}
            />
            <div className="mt-4 flex justify-end">
              <Button color="primary" onPress={handleApplyFilters} isLoading={loading}>
                Apply Filters
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Data Table */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Data {reportData && `(${reportData.count} total)`}
              </h3>
              <Select
                label="Rows per page"
                size="sm"
                selectedKeys={[String(filters.page_size)]}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="w-32"
              >
                <SelectItem key="10">10</SelectItem>
                <SelectItem key="20">20</SelectItem>
                <SelectItem key="50">50</SelectItem>
                <SelectItem key="100">100</SelectItem>
              </Select>
            </div>

            <Divider className="mb-4" />

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner label="Loading data..." />
              </div>
            ) : (
              <>
                <ReportTable
                  reportType={reportType}
                  data={(reportData?.data || []) as Record<string, unknown>[]}
                  loading={loading}
                />

                {reportData && reportData.total_pages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      total={reportData.total_pages}
                      page={reportData.page}
                      onChange={handlePageChange}
                      showControls
                      showShadow
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function ReportViewerPage() {
  return (
    <ProtectedRoute>
      <ReportViewerContent />
    </ProtectedRoute>
  );
}
