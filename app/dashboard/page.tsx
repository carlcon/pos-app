'use client';

import { Spinner } from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useDashboard } from '@/hooks/useDashboard';
import SalesChart from '@/components/dashboard/SalesChart';
import RevenueChart from '@/components/dashboard/RevenueChart';
import TopProducts from '@/components/dashboard/TopProducts';
import LowStockAlert from '@/components/dashboard/LowStockAlert';
import RecentSales from '@/components/dashboard/RecentSales';
import PaymentMethodChart from '@/components/dashboard/PaymentMethodChart';

function DashboardContent() {
  const { stats, loading, error } = useDashboard();

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

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navbar />
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12 space-y-4 sm:space-y-6 xl:space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#242832]">Business Dashboard</h1>
          <p className="text-sm sm:text-base xl:text-lg text-default-500">Track your sales, inventory, and performance — one day at a time.</p>
        </div>

        {/* Date Banner */}
        <div className="bg-gradient-to-r from-[#049AE0] to-[#0B7FBF] rounded-xl sm:rounded-2xl p-6 sm:p-8 xl:p-10 text-white shadow-lg">
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2">{currentDate}</h2>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/90">
            Start fresh each day. Record your sales, track your inventory, and celebrate small wins— your future self will thank you.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 xl:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 xl:p-8 shadow-sm border border-gray-100">
            <p className="text-xs xl:text-sm font-semibold text-[#049AE0] uppercase tracking-wide mb-2">Today&apos;s Sales</p>
            <p className="text-2xl sm:text-3xl xl:text-4xl font-bold text-[#242832] mb-1">
              ₱{parseFloat(stats.today_sales.total).toLocaleString()}
            </p>
            <p className="text-xs text-default-400">
              {stats.today_sales.count} transactions
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 xl:p-8 shadow-sm border border-gray-100">
            <p className="text-xs xl:text-sm font-semibold text-[#049AE0] uppercase tracking-wide mb-2">Revenue</p>
            <p className="text-2xl sm:text-3xl xl:text-4xl font-bold text-[#242832] mb-1">
              ₱{(stats.monthly_revenue.slice(-1)[0]?.revenue || 0).toLocaleString()}
            </p>
            <p className="text-xs text-default-400">This month</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 xl:p-8 shadow-sm border border-gray-100">
            <p className="text-xs xl:text-sm font-semibold text-[#049AE0] uppercase tracking-wide mb-2">Inventory Value</p>
            <p className="text-2xl sm:text-3xl xl:text-4xl font-bold text-[#242832] mb-1">
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
