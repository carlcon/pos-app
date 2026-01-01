'use client';

import { Input, Select, SelectItem, Button, DatePicker } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import type { ReportFilters } from '@/types';

interface ReportFiltersProps {
  reportType: string;
  filters: ReportFilters;
  onFilterChange: (key: keyof ReportFilters, value: string | number) => void;
  onClearFilters: () => void;
  stores?: Array<{ id: number; name: string }>;
  categories?: Array<{ id: number; name: string }>;
  showStoreFilter?: boolean;
}

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Cash' },
  { key: 'CARD', label: 'Card' },
  { key: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { key: 'CHECK', label: 'Check' },
  { key: 'CREDIT', label: 'Credit' },
];

const TRANSACTION_TYPES = [
  { key: 'IN', label: 'Stock In' },
  { key: 'OUT', label: 'Stock Out' },
  { key: 'ADJUSTMENT', label: 'Adjustment' },
];

const STOCK_STATUS = [
  { key: 'ALL', label: 'All Status' },
  { key: 'OK', label: 'OK' },
  { key: 'LOW', label: 'Low Stock' },
  { key: 'OUT', label: 'Out of Stock' },
];

export function ReportFilters({
  reportType,
  filters,
  onFilterChange,
  onClearFilters,
  stores = [],
  categories = [],
  showStoreFilter = false,
}: ReportFiltersProps) {
  const isInventoryReport = ['stock-levels', 'low-stock', 'stock-movement', 'inventory-valuation'].includes(reportType);
  const isProductReport = ['top-selling', 'products-by-category'].includes(reportType);
  const isExpenseReport = ['monthly-expenses', 'expenses-by-category', 'expenses-by-vendor', 'expense-transactions'].includes(reportType);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button size="sm" variant="flat" onPress={onClearFilters}>
          Clear Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Date filters for most reports */}
        {(reportType === 'daily-sales') && (
          <DatePicker
            label="Date"
            value={filters.date ? parseDate(filters.date) : null}
            onChange={(date) => onFilterChange('date', date ? date.toString() : '')}
            classNames={{
              base: "w-full",
              inputWrapper: "bg-white border border-gray-200 hover:border-[#049AE0] data-[hover=true]:bg-white shadow-sm",
            }}
          />
        )}

        {(['weekly-sales', 'monthly-revenue', 'stock-movement', 'top-selling', 'monthly-expenses', 'expenses-by-category', 'expenses-by-vendor', 'expense-transactions'].includes(reportType)) && (
          <>
            <DatePicker
              label="From Date"
              value={filters.date_from ? parseDate(filters.date_from) : null}
              onChange={(date) => onFilterChange('date_from', date ? date.toString() : '')}
              classNames={{
                base: "w-full",
                inputWrapper: "bg-white border border-gray-200 hover:border-[#049AE0] data-[hover=true]:bg-white shadow-sm",
              }}
            />
            <DatePicker
              label="To Date"
              value={filters.date_to ? parseDate(filters.date_to) : null}
              onChange={(date) => onFilterChange('date_to', date ? date.toString() : '')}
              classNames={{
                base: "w-full",
                inputWrapper: "bg-white border border-gray-200 hover:border-[#049AE0] data-[hover=true]:bg-white shadow-sm",
              }}
            />
          </>
        )}

        {/* Days selector for time-based reports */}
        {(['stock-movement', 'top-selling', 'expenses-by-category', 'expenses-by-vendor', 'expense-transactions'].includes(reportType)) && (
          <Select
            label="Time Period"
            selectedKeys={filters.days ? [String(filters.days)] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];
              onFilterChange('days', value ? parseInt(value as string) : 30);
            }}
          >
            <SelectItem key="7">Last 7 days</SelectItem>
            <SelectItem key="30">Last 30 days</SelectItem>
            <SelectItem key="60">Last 60 days</SelectItem>
            <SelectItem key="90">Last 90 days</SelectItem>
          </Select>
        )}

        {/* Payment method filter for sales reports */}
        {(reportType === 'daily-sales' || reportType === 'payment-breakdown' || reportType === 'expense-transactions') && (
          <Select
            label="Payment Method"
            placeholder="All Methods"
            selectedKeys={filters.payment_method ? [filters.payment_method] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];
              onFilterChange('payment_method', value ? String(value) : '');
            }}
          >
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method.key}>
                {method.label}
              </SelectItem>
            ))}
          </Select>
        )}

        {/* Category filter */}
        {(isInventoryReport || isProductReport || isExpenseReport) && categories.length > 0 && (
          <Select
            label="Category"
            placeholder="All Categories"
            selectedKeys={filters.category ? [filters.category] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];
              onFilterChange('category', value ? String(value) : '');
            }}
          >
            {categories.map((cat) => (
              <SelectItem key={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </Select>
        )}

        {/* Stock status filter */}
        {reportType === 'stock-levels' && (
          <Select
            label="Status"
            selectedKeys={filters.status ? [filters.status] : ['ALL']}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];
              onFilterChange('status', value ? String(value) : 'ALL');
            }}
          >
            {STOCK_STATUS.map((status) => (
              <SelectItem key={status.key}>
                {status.label}
              </SelectItem>
            ))}
          </Select>
        )}

        {/* Transaction type filter */}
        {reportType === 'stock-movement' && (
          <Select
            label="Transaction Type"
            placeholder="All Types"
            selectedKeys={filters.transaction_type ? [filters.transaction_type] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];
              onFilterChange('transaction_type', value ? String(value) : '');
            }}
          >
            {TRANSACTION_TYPES.map((type) => (
              <SelectItem key={type.key}>
                {type.label}
              </SelectItem>
            ))}
          </Select>
        )}

        {/* Search filter */}
        {(['stock-levels', 'low-stock', 'expenses-by-vendor', 'expense-transactions'].includes(reportType)) && (
          <Input
            type="text"
            label={reportType.includes('expense') ? 'Search Vendor/Title' : 'Search Product'}
            placeholder="Type to search..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        )}

        {/* Limit selector for top-selling */}
        {reportType === 'top-selling' && (
          <Select
            label="Top Products"
            selectedKeys={filters.limit ? [String(filters.limit)] : ['20']}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];
              onFilterChange('limit', value ? parseInt(value as string) : 20);
            }}
          >
            <SelectItem key="10">Top 10</SelectItem>
            <SelectItem key="20">Top 20</SelectItem>
            <SelectItem key="50">Top 50</SelectItem>
            <SelectItem key="100">Top 100</SelectItem>
          </Select>
        )}

        {/* Store filter for partner admins */}
        {showStoreFilter && stores.length > 0 && (
          <Select
            label="Store"
            placeholder="All Stores"
            selectedKeys={filters.store_id ? [String(filters.store_id)] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0];
              onFilterChange('store_id', value ? parseInt(value as string) : 0);
            }}
          >
            {stores.map((store) => (
              <SelectItem key={String(store.id)}>
                {store.name}
              </SelectItem>
            ))}
          </Select>
        )}
      </div>
    </div>
  );
}
