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

  const generatePDFReport = async (reportType: string, reportName: string) => {
    setReportLoading(true);
    setCurrentReport(reportName);
    setTaskStatus(null);
    
    try {
      const payload: Record<string, unknown> = {
        report_type: reportType,
        format: 'pdf',
      };
      
      if (selectedStoreId) {
        payload.store_id = selectedStoreId;
      }
      
      const response = await api.post<{ task_id: string; status: string }>('/dashboard/reports/generate/', payload);
      
      if (response.data.task_id) {
        onOpen();
        startPolling(response.data.task_id);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      addToast({
        title: 'Error',
        description: 'Failed to start report generation',
        color: 'danger',
      });
      setReportLoading(false);
    }
  };

  const startPolling = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get<TaskStatus>(`/dashboard/reports/status/${id}/`);
        setTaskStatus(response.data);
        
        if (response.data.status === 'completed') {
          clearInterval(interval);
          setPollingInterval(null);
          setReportLoading(false);
          
          addToast({
            title: 'Report Ready',
            description: 'Your report has been generated successfully!',
            color: 'success',
          });
        } else if (response.data.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          setReportLoading(false);
          
          addToast({
            title: 'Error',
            description: response.data.error || 'Report generation failed',
            color: 'danger',
          });
        }
      } catch (error) {
        console.error('Error checking task status:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    setPollingInterval(interval);
  };

  const downloadPDF = () => {
    if (taskStatus?.download_url) {
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}${taskStatus.download_url}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const exportToCSV = async (reportType: string) => {
    try {
      const params = new URLSearchParams();
      if (selectedStoreId) params.append('store_id', selectedStoreId.toString());
      
      const response = await api.get(`/dashboard/reports/${reportType}/${params.toString() ? `?${params.toString()}` : ''}`);
      const reportData = response.data;
      
      let csvContent = '';
      const reportTitle = reportData.report_type || 'Report';

      csvContent += `${reportTitle}\n`;
      csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

      if (reportData.summary && typeof reportData.summary === 'object') {
        csvContent += 'Summary\n';
        Object.entries(reportData.summary).forEach(([key, value]) => {
          csvContent += `${key.replace(/_/g, ' ')},${value}\n`;
        });
        csvContent += '\n';
      }

      const arrayKeys = Object.keys(reportData).filter(
        key => Array.isArray(reportData[key]) && reportData[key].length > 0
      );

      arrayKeys.forEach(key => {
        const items = reportData[key];
        if (items.length > 0) {
          csvContent += `${key.replace(/_/g, ' ').toUpperCase()}\n`;
          const headers = Object.keys(items[0]);
          csvContent += headers.join(',') + '\n';
          
          items.forEach((item: Record<string, unknown>) => {
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

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      addToast({
        title: 'Export Successful',
        description: 'CSV file has been downloaded',
        color: 'success',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      addToast({
        title: 'Error',
        description: 'Failed to export CSV',
        color: 'danger',
      });
    }
  };

  const closeModal = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setTaskStatus(null);
    setReportLoading(false);
    onClose();
  };

  const getStatusColor = () => {
    if (!taskStatus) return 'default';
    switch (taskStatus.status) {
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'processing': return 'primary';
      default: return 'default';
    }
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
          {Object.entries(REPORT_TYPES).map(([category, reports]) => (
            <Card key={category}>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold mb-4">{category}</h3>
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.endpoint} className="flex gap-2">
                      <Button 
                        className="flex-1 justify-start" 
                        variant="flat"
                        onPress={() => generatePDFReport(report.endpoint, report.name)}
                        isLoading={reportLoading && currentReport === report.name}
                      >
                        {report.icon} {report.name}
                      </Button>
                      <Button
                        size="sm"
                        variant="bordered"
                        color="success"
                        isIconOnly
                        onPress={() => exportToCSV(report.endpoint)}
                        title="Export CSV"
                      >
                        📊
                      </Button>
                    </div>
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

        {/* Report Generation Modal */}
        <Modal 
          isOpen={isOpen} 
          onClose={closeModal} 
          isDismissable={!reportLoading}
          size="lg"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <span className="text-xl font-bold">{currentReport}</span>
            </ModalHeader>
            <ModalBody className="py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  {taskStatus?.status === 'completed' ? (
                    <div className="text-success text-6xl">✓</div>
                  ) : taskStatus?.status === 'failed' ? (
                    <div className="text-danger text-6xl">✕</div>
                  ) : (
                    <Spinner size="lg" color={getStatusColor()} />
                  )}
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    {taskStatus?.status === 'completed' ? 'Report Ready!' :
                     taskStatus?.status === 'failed' ? 'Generation Failed' :
                     taskStatus?.status === 'processing' ? 'Generating Report...' :
                     'Starting...'}
                  </p>
                  <p className="text-sm text-default-500 mt-2">
                    {taskStatus?.message || taskStatus?.error || 'Please wait while we prepare your report'}
                  </p>
                </div>

                {taskStatus?.status === 'completed' && (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                    <p className="text-sm text-success-700">
                      Your PDF report has been generated and is ready for download.
                    </p>
                  </div>
                )}

                {taskStatus?.status === 'failed' && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                    <p className="text-sm text-danger-700">
                      {taskStatus.error || 'An error occurred while generating your report.'}
                    </p>
                  </div>
                )}

                {reportLoading && (
                  <Progress
                    size="sm"
                    isIndeterminate
                    color={getStatusColor()}
                    aria-label="Generating report..."
                  />
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              {taskStatus?.status === 'completed' ? (
                <>
                  <Button variant="flat" onPress={closeModal}>
                    Close
                  </Button>
                  <Button color="primary" onPress={downloadPDF}>
                    📄 Download PDF
                  </Button>
                </>
              ) : taskStatus?.status === 'failed' ? (
                <Button color="danger" variant="flat" onPress={closeModal}>
                  Close
                </Button>
              ) : (
                <Button variant="flat" onPress={closeModal} isDisabled={reportLoading}>
                  Cancel
                </Button>
              )}
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
