'use client';

import { Chip } from '@heroui/react';

interface TopProduct {
  product__name: string;
  total_quantity: number;
  total_revenue: number;
}

interface TopProductsProps {
  products: TopProduct[];
}

export default function TopProducts({ products }: TopProductsProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {products.length === 0 ? (
        <p className="text-xs sm:text-sm text-default-400 text-center py-8">No sales data available</p>
      ) : (
        products.map((product, index) => (
          <div key={index} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#049AE0]/10 text-[#049AE0] font-bold text-xs sm:text-sm flex-shrink-0">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs sm:text-sm text-[#242832] truncate">{product.product__name}</p>
                <p className="text-xs text-default-500">{product.total_quantity} units sold</p>
              </div>
            </div>
            <Chip className="bg-[#049AE0]/10 text-[#049AE0] ml-2 flex-shrink-0" variant="flat" size="sm">
              ₱{product.total_revenue.toLocaleString()}
            </Chip>
          </div>
        ))
      )}
    </div>
  );
}
