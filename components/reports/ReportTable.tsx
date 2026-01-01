'use client';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from '@heroui/react';
import type { ReportColumn } from '@/types';

interface ReportTableProps {
  reportType: string;
  data: Record<string, unknown>[];
  loading?: boolean;
  sortDescriptor?: { column: string; direction: 'ascending' | 'descending' };
  onSortChange?: (descriptor: { column: string; direction: 'ascending' | 'descending' }) => void;
}

// Column definitions for each report type
const COLUMN_CONFIGS: Record<string, ReportColumn[]> = {
  'daily-sales': [
    { key: 'sale_number', label: 'Sale #', sortable: true },
    { key: 'time', label: 'Time', sortable: true },
    { key: 'customer_name', label: 'Customer', sortable: true },
    { key: 'payment_method', label: 'Payment', sortable: true },
    { key: 'total_amount', label: 'Amount', sortable: true, format: 'currency', align: 'end' },
    { key: 'cashier', label: 'Cashier', sortable: true },
  ],
  'weekly-sales': [
    { key: 'date', label: 'Date', sortable: true, format: 'date' },
    { key: 'day_name', label: 'Day', sortable: false },
    { key: 'total', label: 'Revenue', sortable: true, format: 'currency', align: 'end' },
    { key: 'count', label: 'Transactions', sortable: true, format: 'number', align: 'end' },
  ],
  'monthly-revenue': [
    { key: 'month', label: 'Month', sortable: true },
    { key: 'total_revenue', label: 'Revenue', sortable: true, format: 'currency', align: 'end' },
    { key: 'total_cost', label: 'Cost', sortable: true, format: 'currency', align: 'end' },
    { key: 'gross_income', label: 'Gross Income', sortable: true, format: 'currency', align: 'end' },
    { key: 'profit_margin', label: 'Margin %', sortable: true, format: 'percentage', align: 'end' },
    { key: 'transaction_count', label: 'Transactions', sortable: true, format: 'number', align: 'end' },
  ],
  'payment-breakdown': [
    { key: 'display_name', label: 'Payment Method', sortable: true },
    { key: 'total', label: 'Total', sortable: true, format: 'currency', align: 'end' },
    { key: 'count', label: 'Count', sortable: true, format: 'number', align: 'end' },
    { key: 'percentage', label: 'Percentage', sortable: true, format: 'percentage', align: 'end' },
  ],
  'stock-levels': [
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'name', label: 'Product', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'current_stock', label: 'Stock', sortable: true, format: 'number', align: 'end' },
    { key: 'minimum_stock_level', label: 'Min Level', sortable: true, format: 'number', align: 'end' },
    { key: 'stock_value', label: 'Value', sortable: true, format: 'currency', align: 'end' },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'store_name', label: 'Store', sortable: true },
  ],
  'low-stock': [
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'name', label: 'Product', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'current_stock', label: 'Current', sortable: true, format: 'number', align: 'end' },
    { key: 'minimum_stock_level', label: 'Min Level', sortable: true, format: 'number', align: 'end' },
    { key: 'deficit', label: 'Deficit', sortable: true, format: 'number', align: 'end' },
    { key: 'reorder_quantity', label: 'Reorder Qty', sortable: true, format: 'number', align: 'end' },
    { key: 'reorder_cost', label: 'Reorder Cost', sortable: true, format: 'currency', align: 'end' },
  ],
  'stock-movement': [
    { key: 'date', label: 'Date', sortable: true, format: 'datetime' },
    { key: 'product_name', label: 'Product', sortable: true },
    { key: 'product_sku', label: 'SKU', sortable: true },
    { key: 'transaction_type', label: 'Type', sortable: true },
    { key: 'reason', label: 'Reason', sortable: true },
    { key: 'quantity', label: 'Qty', sortable: true, format: 'number', align: 'end' },
    { key: 'quantity_before', label: 'Before', sortable: true, format: 'number', align: 'end' },
    { key: 'quantity_after', label: 'After', sortable: true, format: 'number', align: 'end' },
    { key: 'performed_by', label: 'By', sortable: true },
  ],
  'inventory-valuation': [
    { key: 'name', label: 'Category', sortable: true },
    { key: 'product_count', label: 'Products', sortable: true, format: 'number', align: 'end' },
    { key: 'total_units', label: 'Total Units', sortable: true, format: 'number', align: 'end' },
    { key: 'cost_value', label: 'Cost Value', sortable: true, format: 'currency', align: 'end' },
    { key: 'retail_value', label: 'Retail Value', sortable: true, format: 'currency', align: 'end' },
  ],
  'top-selling': [
    { key: 'rank', label: '#', sortable: false, align: 'center' },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'name', label: 'Product', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'quantity_sold', label: 'Qty Sold', sortable: true, format: 'number', align: 'end' },
    { key: 'revenue', label: 'Revenue', sortable: true, format: 'currency', align: 'end' },
    { key: 'transaction_count', label: 'Transactions', sortable: true, format: 'number', align: 'end' },
  ],
  'products-by-category': [
    { key: 'name', label: 'Category', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'product_count', label: 'Products', sortable: true, format: 'number', align: 'end' },
    { key: 'total_stock', label: 'Total Stock', sortable: true, format: 'number', align: 'end' },
    { key: 'stock_value', label: 'Stock Value', sortable: true, format: 'currency', align: 'end' },
  ],
  'monthly-expenses': [
    { key: 'month', label: 'Month', sortable: true },
    { key: 'total_expenses', label: 'Total Expenses', sortable: true, format: 'currency', align: 'end' },
    { key: 'transaction_count', label: 'Transactions', sortable: true, format: 'number', align: 'end' },
  ],
  'expenses-by-category': [
    { key: 'name', label: 'Category', sortable: true },
    { key: 'total', label: 'Total', sortable: true, format: 'currency', align: 'end' },
    { key: 'count', label: 'Count', sortable: true, format: 'number', align: 'end' },
    { key: 'percentage', label: 'Percentage', sortable: true, format: 'percentage', align: 'end' },
  ],
  'expenses-by-vendor': [
    { key: 'name', label: 'Vendor', sortable: true },
    { key: 'total', label: 'Total', sortable: true, format: 'currency', align: 'end' },
    { key: 'count', label: 'Count', sortable: true, format: 'number', align: 'end' },
    { key: 'percentage', label: 'Percentage', sortable: true, format: 'percentage', align: 'end' },
  ],
  'expense-transactions': [
    { key: 'date', label: 'Date', sortable: true, format: 'date' },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'vendor', label: 'Vendor', sortable: true },
    { key: 'payment_method', label: 'Payment', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, format: 'currency', align: 'end' },
    { key: 'created_by', label: 'Created By', sortable: true },
  ],
};

function formatCellValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '-';
  
  const strValue = String(value);
  
  // If value is already a formatted string (contains currency symbol or percentage), return as-is
  if (typeof value === 'string' && (value.includes('₱') || value.includes('%'))) {
    return value;
  }
  
  switch (format) {
    case 'currency':
      return `₱${parseFloat(strValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'number':
      return parseFloat(strValue).toLocaleString('en-US');
    case 'percentage':
      return `${parseFloat(strValue).toFixed(2)}%`;
    case 'date':
      return new Date(strValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    case 'datetime':
      return new Date(strValue).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    default:
      return strValue;
  }
}

function getStatusColor(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'OK') return 'success';
  if (status === 'Low Stock') return 'warning';
  if (status === 'Out of Stock') return 'danger';
  return 'default';
}

export function ReportTable({
  reportType,
  data,
  loading = false,
  sortDescriptor,
  onSortChange,
}: ReportTableProps) {
  const columns = COLUMN_CONFIGS[reportType] || [];

  if (columns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No column configuration for report type: {reportType}
      </div>
    );
  }

  // Add _idx for keys and ensure proper typing
  type ItemWithIndex = Record<string, unknown> & { _idx: number };
  const itemsWithIndex: ItemWithIndex[] = data.map((item, idx) => ({ ...item, _idx: idx }));

  return (
    <div className="overflow-x-auto">
      <Table
        aria-label="Report data table"
        sortDescriptor={sortDescriptor}
        onSortChange={(descriptor) => onSortChange?.({
          column: String(descriptor.column),
          direction: descriptor.direction as 'ascending' | 'descending'
        })}
        classNames={{
          wrapper: 'min-w-full',
          table: 'min-w-full',
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              allowsSorting={column.sortable}
              align={column.align || 'start'}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={itemsWithIndex}
          isLoading={loading}
          loadingContent={<Spinner label="Loading..." />}
          emptyContent="No data available"
        >
          {(item) => (
            <TableRow key={item.id !== undefined ? String(item.id) : `row-${item._idx}`}>
              {(columnKey) => {
                const column = columns.find((c) => c.key === columnKey);
                const value = item[String(columnKey)];

                // Special rendering for status column
                if (columnKey === 'status') {
                  return (
                    <TableCell>
                      <Chip color={getStatusColor(String(value))} size="sm" variant="flat">
                        {String(value)}
                      </Chip>
                    </TableCell>
                  );
                }

                // Special rendering for rank column
                if (columnKey === 'rank') {
                  return (
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${value === 1 ? 'bg-yellow-100 text-yellow-700' :
                            value === 2 ? 'bg-gray-100 text-gray-700' :
                            value === 3 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-600'}
                        `}>
                          {String(value)}
                        </div>
                      </div>
                    </TableCell>
                  );
                }

                return (
                  <TableCell>
                    {formatCellValue(value, column?.format)}
                  </TableCell>
                );
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
