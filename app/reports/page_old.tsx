'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Progress,
  addToast,
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useDashboard } from '@/hooks/useDashboard';
import { useStore } from '@/context/StoreContext';
import api from '@/lib/api';

interface ReportData {
  report_type: string;
  [key: string]: unknown;
}

interface TaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  file_url?: string;
  filename?: string;
  download_url?: string;
  error?: string;
}

function ReportsContent() {
  const { selectedStoreId } = useStore();
  const { stats } = useDashboard(true, selectedStoreId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [reportLoading, setReportLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchReport = async (endpoint: string, reportName: string) => {
    setReportLoading(true);
    setCurrentReport(reportName);
    try {
      const params = new URLSearchParams();
      if (selectedStoreId) params.append('store_id', selectedStoreId.toString());
      const response = await api.get(`/dashboard/reports/${endpoint}/${params.toString() ? `?${params.toString()}` : ''}`);
      setReportData(response.data as ReportData);
      onOpen();
    } catch (error) {
      console.error('Error fetching report:', error);
      addToast({
        title: 'Error',
        description: 'Failed to fetch report data',
        color: 'danger',
      });
    } finally {
      setReportLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = '';
    const reportType = reportData.report_type || 'Report';

    // Add header
    csvContent += `${reportType}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Add summary if exists
    if (reportData.summary && typeof reportData.summary === 'object') {
      csvContent += 'Summary\n';
      Object.entries(reportData.summary as Record<string, unknown>).forEach(([key, value]) => {
        csvContent += `${key.replace(/_/g, ' ')},${value}\n`;
      });
      csvContent += '\n';
    }

    // Find array data to export
    const arrayKeys = Object.keys(reportData).filter(
      key => Array.isArray(reportData[key]) && (reportData[key] as unknown[]).length > 0
    );

    arrayKeys.forEach(key => {
      const items = reportData[key] as Record<string, unknown>[];
      if (items.length > 0) {
        csvContent += `${key.replace(/_/g, ' ').toUpperCase()}\n`;
        
        // Headers
        const headers = Object.keys(items[0]);
        csvContent += headers.join(',') + '\n';
        
        // Data rows
        items.forEach(item => {
          const row = headers.map(h => {
            const val = item[h];
            if (typeof val === 'string' && val.includes(',')) {
              return `"${val}"`;
            }
            return val;
          });
          csvContent += row.join(',') + '\n';
        });
        csvContent += '\n';
      }
    });

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    addToast({
      title: 'Export Successful',
      description: 'CSV file has been downloaded',
      color: 'success',
    });
  };

  const printReport = () => {
    window.print();
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    const summary = reportData.summary as Record<string, unknown> | undefined;

    return (
      <div className="print-content space-y-6 print:space-y-3">
        <style>{printStyles}</style>
        
        {/* Print Header */}
        <div className="print-header hidden print:block">
          <h1 className="text-2xl font-bold print:text-lg">{reportData.report_type || 'Report'}</h1>
          <p className="text-sm text-gray-600 print:text-xs">Generated: {new Date().toLocaleString()}</p>
        </div>

        <div className="space-y-6 print:space-y-2">\n        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print-summary">
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} className="bg-default-100 p-4 rounded-lg">
                <p className="text-xs text-default-500 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-lg font-semibold">
                  {typeof value === 'number' 
                    ? (key.includes('revenue') || key.includes('value') || key.includes('cost') || key.includes('price') || key.includes('profit')) && !key.includes('count') && !key.includes('quantity') && !key.includes('units') && !key.includes('products') && !key.includes('year')
                      ? `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : key.includes('percentage')
                        ? `${value.toFixed(1)}%`
                        : key.includes('year')
                          ? value.toString()
                          : value.toLocaleString()
                    : String(value)
                  }
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Data Tables */}
        {Object.entries(reportData).map(([key, value]) => {
          if (!Array.isArray(value) || value.length === 0) return null;
          if (key === 'report_type' || key === 'summary') return null;

          const items = value as Record<string, unknown>[];
          const columns = Object.keys(items[0]).filter(col => 
            !col.includes('id') || col === 'id'
          ).slice(0, 8); // Limit columns for display

          return (
            <div key={key} className="overflow-x-auto mb-4 print:mb-2">
              <h4 className="text-sm font-semibold mb-2 capitalize print:text-xs print:mb-1">{key.replace(/_/g, ' ')}</h4>
              <Table aria-label={key} isStriped classNames={{ 
                wrapper: "print:shadow-none",
                th: "print:text-xs print:py-1 print:px-2",
                td: "print:text-xs print:py-1 print:px-2"
              }}>
                <TableHeader>
                  {columns.map(col => (
                    <TableColumn key={col} className="capitalize text-xs">
                      {col.replace(/_/g, ' ')}
                    </TableColumn>
                  ))}
                </TableHeader>
                <TableBody>
                  {items.slice(0, 50).map((item, idx) => (
                    <TableRow key={idx}>
                      {columns.map(col => (
                        <TableCell key={col} className="text-sm">
                          {col === 'status' ? (
                            <Chip
                              size="sm"
                              color={
                                item[col] === 'OK' ? 'success' :
                                item[col] === 'Low Stock' ? 'warning' :
                                item[col] === 'Out of Stock' ? 'danger' : 'default'
                              }
                              variant="flat"
                            >
                              {String(item[col])}
                            </Chip>
                          ) : typeof item[col] === 'number' ? (
                            (col.includes('price') || col.includes('value') || col.includes('revenue') || col.includes('cost') || col.includes('profit')) && !col.includes('count') && !col.includes('quantity') && !col.includes('stock') && !col.includes('units') && !col.includes('sold')
                              ? `₱${(item[col] as number).toFixed(2)}`
                              : col.includes('percentage')
                                ? `${(item[col] as number).toFixed(1)}%`
                                : (item[col] as number).toLocaleString()
                          ) : (
                            String(item[col] ?? '-')
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {items.length > 50 && (
                <p className="text-xs text-default-500 mt-2 no-print">
                  Showing 50 of {items.length} items. Export CSV to see all data.
                </p>
              )}
              {items.length > 25 && (
                <p className="hidden print:block text-xs mt-1">
                  Showing first 25 of {items.length} rows. Export CSV for complete data.
                </p>
              )}
            </div>
          );
        })}
        </div>
      </div>
    );
  };

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
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('daily-sales', 'Daily Sales Report')}
                  isLoading={reportLoading && currentReport === 'Daily Sales Report'}
                >
                  📊 Daily Sales Report
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('weekly-sales', 'Weekly Sales Summary')}
                  isLoading={reportLoading && currentReport === 'Weekly Sales Summary'}
                >
                  📈 Weekly Sales Summary
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('monthly-revenue', 'Monthly Revenue Analysis')}
                  isLoading={reportLoading && currentReport === 'Monthly Revenue Analysis'}
                >
                  📉 Monthly Revenue Analysis
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('payment-breakdown', 'Payment Method Breakdown')}
                  isLoading={reportLoading && currentReport === 'Payment Method Breakdown'}
                >
                  💳 Payment Method Breakdown
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4">Inventory Reports</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('stock-levels', 'Stock Levels Report')}
                  isLoading={reportLoading && currentReport === 'Stock Levels Report'}
                >
                  📦 Stock Levels Report
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('low-stock', 'Low Stock Alert Report')}
                  isLoading={reportLoading && currentReport === 'Low Stock Alert Report'}
                >
                  ⚠️ Low Stock Alert Report
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('stock-movement', 'Stock Movement History')}
                  isLoading={reportLoading && currentReport === 'Stock Movement History'}
                >
                  🔄 Stock Movement History
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('inventory-valuation', 'Inventory Valuation')}
                  isLoading={reportLoading && currentReport === 'Inventory Valuation'}
                >
                  💰 Inventory Valuation
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4">Product Reports</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('top-selling', 'Top Selling Products')}
                  isLoading={reportLoading && currentReport === 'Top Selling Products'}
                >
                  🏆 Top Selling Products
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('products-by-category', 'Products by Category')}
                  isLoading={reportLoading && currentReport === 'Products by Category'}
                >
                  📦 Products by Category
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold mb-4">Expense Reports</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('monthly-expenses', 'Monthly Expenses Analysis')}
                  isLoading={reportLoading && currentReport === 'Monthly Expenses Analysis'}
                >
                  📊 Monthly Expenses Analysis
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('expenses-by-category', 'Expenses by Category')}
                  isLoading={reportLoading && currentReport === 'Expenses by Category'}
                >
                  📂 Expenses by Category
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('expenses-by-vendor', 'Expenses by Vendor')}
                  isLoading={reportLoading && currentReport === 'Expenses by Vendor'}
                >
                  🏢 Expenses by Vendor
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="flat"
                  onPress={() => fetchReport('expense-transactions', 'Expense Transactions')}
                  isLoading={reportLoading && currentReport === 'Expense Transactions'}
                >
                  📋 Expense Transactions
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
                    ₱{stats ? parseFloat(stats.total_inventory_value.value).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Report Modal */}
        <Modal 
          isOpen={isOpen} 
          onClose={onClose} 
          size="5xl" 
          scrollBehavior="inside"
          classNames={{
            base: "max-h-[90vh]",
            body: "py-6"
          }}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1 no-print">
              <span className="text-xl font-bold">{reportData?.report_type || 'Report'}</span>
              <span className="text-sm font-normal text-default-500">
                Generated: {new Date().toLocaleString()}
              </span>
            </ModalHeader>
            <ModalBody>
              {reportLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                renderReportContent()
              )}
            </ModalBody>
            <ModalFooter className="border-t no-print">
              <div className="flex gap-2 flex-wrap">
                <Button variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" variant="flat" onPress={printReport}>
                  🖨️ Print
                </Button>
                <Button color="success" onPress={exportToCSV}>
                  📊 Export CSV
                </Button>
              </div>
            </ModalFooter>
          </ModalContent>
        </Modal>
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
