'use client';

import { Progress } from '@heroui/react';

interface LowStockItem {
  name: string;
  barcode: string;
  quantity_in_stock: number;
  reorder_level: number;
}

interface LowStockAlertProps {
  items: LowStockItem[];
}

export default function LowStockAlert({ items }: LowStockAlertProps) {
  const getStockPercentage = (current: number, reorder: number) => {
    return Math.min((current / reorder) * 100, 100);
  };

  const getColor = (percentage: number) => {
    if (percentage <= 25) return 'danger';
    if (percentage <= 50) return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-h-[280px] sm:max-h-[320px] overflow-y-auto">
      {items.length === 0 ? (
        <p className="text-xs sm:text-sm text-default-400 text-center py-8">All items are well stocked ✓</p>
      ) : (
        items.map((item, index) => {
          const percentage = getStockPercentage(item.quantity_in_stock, item.reorder_level);
          return (
            <div key={index} className="space-y-2 pb-3 border-b border-gray-100 last:border-0">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs sm:text-sm text-[#242832] truncate">{item.name}</p>
                  <p className="text-xs text-default-500 truncate">{item.barcode}</p>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#242832] flex-shrink-0">
                  {item.quantity_in_stock} / {item.reorder_level}
                </p>
              </div>
              <Progress 
                value={percentage} 
                color={getColor(percentage)}
                size="sm"
                className="max-w-full"
              />
            </div>
          );
        })
      )}
    </div>
  );
}
