'use client';

import { Card, CardBody, Button } from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useDashboard } from '@/hooks/useDashboard';

function ReportsContent() {
  const { stats } = useDashboard();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12 space-y-4 sm:space-y-6 xl:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-foreground">Reports</h1>
          <p className="text-sm sm:text-base xl:text-lg text-default-500 mt-1">Business analytics and insights</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sales Reports</h3>
              <div className="space-y-3">
                <Button className="w-full" variant="flat">
                  📊 Daily Sales Report
                </Button>
                <Button className="w-full" variant="flat">
                  📈 Weekly Sales Summary
                </Button>
                <Button className="w-full" variant="flat">
                  📉 Monthly Revenue Analysis
                </Button>
                <Button className="w-full" variant="flat">
                  💳 Payment Method Breakdown
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4">Inventory Reports</h3>
              <div className="space-y-3">
                <Button className="w-full" variant="flat">
                  📦 Stock Levels Report
                </Button>
                <Button className="w-full" variant="flat">
                  ⚠️ Low Stock Alert Report
                </Button>
                <Button className="w-full" variant="flat">
                  🔄 Stock Movement History
                </Button>
                <Button className="w-full" variant="flat">
                  💰 Inventory Valuation
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4">Product Reports</h3>
              <div className="space-y-3">
                <Button className="w-full" variant="flat">
                  🏆 Top Selling Products
                </Button>
                <Button className="w-full" variant="flat">
                  📦 Products by Category
                </Button>
                <Button className="w-full" variant="flat">
                  💵 Profit Margin Analysis
                </Button>
                <Button className="w-full" variant="flat">
                  🔍 Product Performance
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-default-50 rounded">
                  <span className="text-default-600">Today&apos;s Sales:</span>
                  <span className="font-semibold">
                    ${stats ? parseFloat(stats.today_sales.total).toFixed(2) : '0.00'}
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
                    ${stats ? parseFloat(stats.total_inventory_value.value).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="border-2 border-primary">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold mb-4">Export Options</h3>
            <div className="flex gap-4">
              <Button color="primary">
                📄 Export to PDF
              </Button>
              <Button color="success">
                📊 Export to Excel
              </Button>
              <Button color="secondary">
                📋 Export to CSV
              </Button>
            </div>
          </CardBody>
        </Card>
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
