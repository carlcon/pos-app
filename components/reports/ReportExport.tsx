'use client';

import { useState } from 'react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Progress,
} from '@heroui/react';
import api from '@/lib/api';
import type { ReportFilters } from '@/types';

interface ReportExportProps {
  reportType: string;
  reportName: string;
  filters: ReportFilters;
}

interface TaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  download_url?: string;
  error?: string;
}

export function ReportExport({ reportType, reportName, filters }: ReportExportProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const exportToPDF = async () => {
    setLoading(true);
    setTaskStatus(null);
    onOpen();

    try {
      const payload = {
        report_type: reportType,
        format: 'pdf',
        ...filters,
      };

      const response = await api.post<{ task_id: string }>('/dashboard/reports/generate/', payload);

      if (response.data.task_id) {
        startPolling(response.data.task_id);
      }
    } catch (error) {
      console.error('PDF export error:', error);
      setTaskStatus({
        status: 'failed',
        error: 'Failed to start PDF generation',
      });
      setLoading(false);
    }
  };

  const startPolling = (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get<TaskStatus>(`/dashboard/reports/status/${taskId}/`);
        setTaskStatus(response.data);

        if (response.data.status === 'completed') {
          clearInterval(interval);
          setPollingInterval(null);
          setLoading(false);
        } else if (response.data.status === 'failed') {
          clearInterval(interval);
          setPollingInterval(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  const downloadPDF = () => {
    if (taskStatus?.download_url) {
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}${taskStatus.download_url}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const exportToCSV = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/dashboard/reports/${reportType}/${params.toString() ? `?${params.toString()}` : ''}`);
      const reportData = response.data;

      let csvContent = '';
      csvContent += `${reportName}\n`;
      csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

      if (reportData.summary && typeof reportData.summary === 'object') {
        csvContent += 'Summary\n';
        Object.entries(reportData.summary).forEach(([key, value]) => {
          csvContent += `${key.replace(/_/g, ' ')},${value}\n`;
        });
        csvContent += '\n';
      }

      // Find data arrays in response
      const dataKey = Object.keys(reportData).find(
        key => Array.isArray(reportData[key]) && reportData[key].length > 0 && key !== 'hourly_breakdown'
      ) || 'data';

      const items = reportData[dataKey] || [];
      if (items.length > 0) {
        csvContent += `${dataKey.replace(/_/g, ' ').toUpperCase()}\n`;
        const headers = Object.keys(items[0]);
        csvContent += headers.join(',') + '\n';

        items.forEach((item: Record<string, any>) => {
          const row = headers.map(h => {
            const val = item[h];
            if (typeof val === 'string' && val.includes(',')) {
              return `"${val}"`;
            }
            return val;
          });
          csvContent += row.join(',') + '\n';
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('CSV export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setTaskStatus(null);
    setLoading(false);
    onClose();
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          color="primary"
          onPress={exportToPDF}
          isLoading={loading && !isOpen}
        >
          📄 Export to PDF
        </Button>
        <Button
          color="success"
          variant="bordered"
          onPress={exportToCSV}
          isLoading={loading && !isOpen}
        >
          📊 Export to CSV
        </Button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} isDismissable={!loading} size="lg">
        <ModalContent>
          <ModalHeader>
            <span className="text-xl font-bold">Generating PDF: {reportName}</span>
          </ModalHeader>
          <ModalBody className="py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                {taskStatus?.status === 'completed' ? (
                  <div className="text-success text-6xl">✓</div>
                ) : taskStatus?.status === 'failed' ? (
                  <div className="text-danger text-6xl">✕</div>
                ) : (
                  <Spinner size="lg" color="primary" />
                )}
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold">
                  {taskStatus?.status === 'completed'
                    ? 'Report Ready!'
                    : taskStatus?.status === 'failed'
                    ? 'Generation Failed'
                    : taskStatus?.status === 'processing'
                    ? 'Generating Report...'
                    : 'Starting...'}
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

              {loading && (
                <Progress size="sm" isIndeterminate color="primary" aria-label="Generating report..." />
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
              <Button variant="flat" onPress={closeModal} isDisabled={loading}>
                Cancel
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
