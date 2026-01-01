'use client';

import { useRouter } from 'next/navigation';
import { Card, CardBody, Button } from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useDashboard } from '@/hooks/useDashboard';
import { useStore } from '@/context/StoreContext';

interface ReportButton {
  endpoint: string;
  name: string;
  icon: string;
}

const REPORT_TYPES: Record<string, ReportButton[]> = {
  'Sales Reports': [
    { endpoint: 'daily-sales', name: 'Daily Sales Report', icon: '📊' },
    { endpoint: 'weekly-sales', name: 'Weekly Sales Summary', icon: '📈' },
    { endpoint: 'monthly-revenue', name: 'Monthly Revenue Analysis', icon: '📉' },
    { endpoint: 'payment-breakdown', name: 'Payment Method Breakdown', icon: '💳' },
  ],
  'Inventory Reports': [
    { endpoint: 'stock-levels', name: 'Stock Levels Report', icon: '📦' },
    { endpoint: 'low-stock', name: 'Low Stock Alert Report', icon: '⚠️' },
    { endpoint: 'stock-movement', name: 'Stock Movement History', icon: '🔄' },
    { endpoint: 'inventory-valuation', name: 'Inventory Valuation', icon: '💰' },
  ],
  'Product Reports': [
    { endpoint: 'top-selling', name: 'Top Selling Products', icon: '🏆' },
    { endpoint: 'products-by-category', name: 'Products by Category', icon: '📦' },
  ],
  'Expense Reports': [
    { endpoint: 'monthly-expenses', name: 'Monthly Expenses Analysis', icon: '📊' },
    { endpoint: 'expenses-by-category', name: 'Expenses by Category', icon: '📂' },
    { endpoint: 'expenses-by-vendor', name: 'Expenses by Vendor', icon: '🏢' },
    { endpoint: 'expense-transactions', name: 'Expense Transactions', icon: '📋' },
  ],
};

function ReportsContent() {
  const router = useRouter();
  const { selectedStoreId } = useStore();
  const { stats } = useDashboard(true, selectedStoreId);

  const handleReportClick = (endpoint: string) => {
    router.push(`/reports/${endpoint}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12 space-y-4 sm:space-y-6 xl:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-foreground">Reports</h1>
          <p className="text-sm sm:text-base xl:text-lg text-default-500 mt-1">
            Select a report to view data, apply filters, and export to PDF or CSV
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
          {Object.entries(REPORT_TYPES).map(([category, reports]) => (
            <Card key={category}>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold mb-4">{category}</h3>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <Button
                      key={report.endpoint}
                      className="w-full justify-start"
                      variant="flat"
                      onPress={() => handleReportClick(report.endpoint)}
                    >
                      <span className="mr-2">{report.icon}</span>
                      {report.name}
                    </Button>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}

          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-default-50 rounded">
                  <span className="text-default-600">Today&apos;s Sales:</span>
                  <span className="font-semibold">
                    ₱{stats ? parseFloat(stats.today_sales.total).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-default-50 rounded">
                  <span className="text-default-600">Total Products:</span>
                  <span className="font-semibold">{stats?.stock_summary.total_products || 0}</span>
                </div>
                <div className="flex justify-between p-3 bg-default-50 rounded">
                  <span className="text-default-600">Low Stock Items:</span>
                  <span className="font-semibold text-warning">
                    {stats?.stock_summary.low_stock_count || 0}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-default-50 rounded">
                  <span className="text-default-600">Inventory Value:</span>
                  <span className="font-semibold text-success">
                    ₱{stats ? parseFloat(stats.total_inventory_value.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  );
}
