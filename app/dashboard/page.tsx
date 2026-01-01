'use client';

import { Spinner, Select, SelectItem, type Selection } from '@heroui/react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useDashboard } from '@/hooks/useDashboard';
import { useExpenseStats } from '@/hooks/useExpenses';
import SalesChart from '@/components/dashboard/SalesChart';
import RevenueChart from '@/components/dashboard/RevenueChart';
import TopProducts from '@/components/dashboard/TopProducts';
import LowStockAlert from '@/components/dashboard/LowStockAlert';
import RecentSales from '@/components/dashboard/RecentSales';
import PaymentMethodChart from '@/components/dashboard/PaymentMethodChart';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';

function DashboardContent() {
  const { isSuperAdmin, isImpersonatingPartner, isImpersonatingStore, isStoreLevelUser, effectiveStoreId } = useAuth();
  const { stores, selectedStoreId, setSelectedStoreId, selectedStore, loading: storeLoading } = useStore();
  
  // Tenant enabled when: not super admin OR when impersonating partner/store
  const tenantEnabled = !isSuperAdmin || isImpersonatingPartner || isImpersonatingStore;
  
  // Determine which store ID to use for API calls
  // Store-level users and store impersonation use their assigned/impersonated store
  // Partner admins can filter by store
  const dashboardStoreId = isStoreLevelUser || isImpersonatingStore ? effectiveStoreId : selectedStoreId;

  const { stats, loading, error } = useDashboard(tenantEnabled, dashboardStoreId);
  const { stats: expenseStats, loading: expenseLoading } = useExpenseStats(tenantEnabled, dashboardStoreId);

  // Store filter options for Partner Admins
  const storeSelectValue = selectedStoreId ? selectedStoreId.toString() : 'all';
  const storeOptions = [
    { key: 'all', label: 'All Stores' },
    ...stores.map(store => ({ key: store.id.toString(), label: store.name })),
  ];

  const handleStoreSelection = (keys: Selection) => {
    if (keys === 'all') {
      setSelectedStoreId(null);
      return;
    }
    const first = Array.from(keys)[0];
    if (first === undefined) return;
    setSelectedStoreId(first === 'all' ? null : Number(first));
  };

  if (!tenantEnabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg">
            <p className="text-sm uppercase tracking-wide text-white/80 mb-2">Super Admin Mode</p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">Manage partners here</h1>
            <p className="text-base sm:text-lg text-white/90">
              Tenant data is hidden until you impersonate a partner. Choose a partner to view their dashboard and operations.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/partners"
                className="inline-flex items-center px-5 py-3 rounded-lg bg-white text-purple-700 font-semibold shadow hover:shadow-md transition"
              >
                Go to Partners
              </Link>
              <div className="inline-flex items-center px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 text-sm">
                Impersonate a partner from the partners page to explore their data.
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Why this view?</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Super admins can manage partners system-wide but must impersonate a partner to access tenant dashboards, sales, stock, or expenses. Pick a partner and start impersonation to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Spinner size="lg" color="primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <p className="text-danger text-lg mb-2">Error loading dashboard</p>
            <p className="text-default-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Whether to show store filter (Partner Admin without store impersonation)
  const showStoreFilter = !isStoreLevelUser && !isImpersonatingStore && stores.length > 1;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navbar />
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12 space-y-4 sm:space-y-6 xl:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#242832]">Business Dashboard</h1>
            <p className="text-sm sm:text-base xl:text-lg text-default-500">
              Track your sales, inventory, and performance — one day at a time
              {selectedStore ? ` • ${selectedStore.name}` : ''}.
            </p>
          </div>
          
          {/* Store Filter for Partner Admins */}
          {showStoreFilter && (
            <Select
              aria-label="Filter by store"
              size="sm"
              isLoading={storeLoading}
              selectedKeys={new Set([storeSelectValue])}
              onSelectionChange={handleStoreSelection}
              className="min-w-[200px] max-w-[250px]"
              radius="lg"
              variant="bordered"
              disallowEmptySelection
              items={storeOptions}
              label="Filter by Store"
            >
              {(item) => (
                <SelectItem key={item.key} textValue={item.label}>
                  {item.label}
                </SelectItem>
              )}
            </Select>
          )}
        </div>

        {/* Date Banner */}
        <div className="bg-gradient-to-r from-[#049AE0] to-[#0B7FBF] rounded-xl sm:rounded-2xl p-6 sm:p-8 xl:p-10 text-white shadow-lg">
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2">{currentDate}</h2>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/90">
            Start fresh each day. Record your sales, track your inventory, and celebrate small wins— your future self will thank you.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 xl:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 xl:p-8 shadow-sm border border-gray-100">
            <p className="text-xs xl:text-sm font-semibold text-[#049AE0] uppercase tracking-wide mb-2">Today&apos;s Sales</p>
            <p className="text-2xl sm:text-3xl xl:text-3xl font-bold text-[#242832] mb-1">
              ₱{parseFloat(stats.today_sales.total).toLocaleString()}
            </p>
            <p className="text-xs text-default-400">
              {stats.today_sales.count} transactions
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 xl:p-8 shadow-sm border border-gray-100">
            <p className="text-xs xl:text-sm font-semibold text-[#049AE0] uppercase tracking-wide mb-2">Revenue</p>
            <p className="text-2xl sm:text-3xl xl:text-3xl font-bold text-[#242832] mb-1">
              ₱{(stats.monthly_revenue.slice(-1)[0]?.revenue || 0).toLocaleString()}
            </p>
            <p className="text-xs text-default-400">This month</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 xl:p-8 shadow-sm border border-gray-100">
            <p className="text-xs xl:text-sm font-semibold text-[#049AE0] uppercase tracking-wide mb-2">Inventory Value</p>
            <p className="text-2xl sm:text-3xl xl:text-3xl font-bold text-[#242832] mb-1">
              ₱{parseFloat(stats.total_inventory_value.value).toLocaleString()}
            </p>
            <p className="text-xs text-default-400">{stats.stock_summary.total_products} products</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 xl:p-8 shadow-sm border border-gray-100">
            <p className="text-xs xl:text-sm font-semibold text-[#049AE0] uppercase tracking-wide mb-2">Active Items</p>
            <p className="text-2xl sm:text-3xl xl:text-4xl font-bold text-[#242832] mb-1">
              {stats.stock_summary.active_products}
            </p>
            <p className="text-xs text-default-400">In catalog</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 xl:p-8 shadow-sm border border-gray-100">
            <p className="text-xs xl:text-sm font-semibold text-[#049AE0] uppercase tracking-wide mb-2">Low Stock</p>
            <p className="text-2xl sm:text-3xl xl:text-4xl font-bold text-[#242832] mb-1">
              {stats.stock_summary.low_stock_count}
            </p>
            <p className="text-xs text-default-400">Need reorder</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 xl:p-8 shadow-sm border border-gray-100">
            <p className="text-xs xl:text-sm font-semibold text-[#049AE0] uppercase tracking-wide mb-2">Out of Stock</p>
            <p className="text-2xl sm:text-3xl xl:text-4xl font-bold text-[#242832] mb-1">
              {stats.stock_summary.out_of_stock_count}
            </p>
            <p className="text-xs text-default-400">Urgent action</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 xl:p-8">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-[#242832] mb-3 sm:mb-4 xl:mb-6">Sales Trends</h3>
            <SalesChart data={stats.weekly_sales} type="line" />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 xl:p-8">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-[#242832] mb-3 sm:mb-4 xl:mb-6">Monthly Revenue</h3>
            <RevenueChart data={stats.monthly_revenue} />
          </div>
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 xl:p-8">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-[#242832] mb-3 sm:mb-4 xl:mb-6">Top Selling Products</h3>
            <TopProducts products={stats.top_selling_products.map(p => ({
              product__name: p.name,
              total_quantity: p.total_sold,
              total_revenue: parseFloat(p.revenue)
            }))} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 xl:p-8">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-[#242832] mb-3 sm:mb-4 xl:mb-6">Payment Methods</h3>
            <PaymentMethodChart data={stats.sales_by_payment_method.map(pm => ({
              payment_method: pm.payment_method,
              total: parseFloat(pm.total)
            }))} />
          </div>
        </div>

        {/* Expenses Trend Row */}
        {!expenseLoading && expenseStats && expenseStats.monthly_trend.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 xl:p-8">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-[#242832] mb-3 sm:mb-4 xl:mb-6">Monthly Expenses Trend</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 font-medium">Total Expenses</p>
                <p className="text-lg sm:text-xl font-bold text-red-700">₱{expenseStats.total_expenses.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 font-medium">This Month</p>
                <p className="text-lg sm:text-xl font-bold text-red-700">₱{expenseStats.this_month_total.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 font-medium">Last Month</p>
                <p className="text-lg sm:text-xl font-bold text-red-700">₱{expenseStats.last_month_total.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 font-medium">Today</p>
                <p className="text-lg sm:text-xl font-bold text-red-700">₱{expenseStats.today_total.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-3">
              {expenseStats.monthly_trend.map((month, idx) => {
                const maxTotal = Math.max(...expenseStats.monthly_trend.map(m => m.total), 1);
                const percentage = (month.total / maxTotal) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-default-600">{month.month}</span>
                      <span className="font-medium text-red-600">₱{month.total.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-default-100 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 xl:p-8">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-[#242832] mb-3 sm:mb-4 xl:mb-6">Low Stock Alerts</h3>
            <LowStockAlert items={stats.low_stock_items.items.map(item => ({
              name: item.name,
              barcode: item.sku,
              quantity_in_stock: item.current_stock,
              reorder_level: item.minimum_stock_level
            }))} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 xl:p-8">
            <h3 className="text-base sm:text-lg xl:text-xl font-bold text-[#242832] mb-3 sm:mb-4 xl:mb-6">Recent Transactions</h3>
            <RecentSales sales={stats.recent_sales.map(sale => ({
              id: sale.id,
              invoice_number: sale.sale_number,
              total_amount: parseFloat(sale.total_amount),
              payment_method: 'CASH',
              created_at: sale.created_at
            }))} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
