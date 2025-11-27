'use client';

interface RecentSale {
  id: number;
  invoice_number: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

interface RecentSalesProps {
  sales: RecentSale[];
}

export default function RecentSales({ sales }: RecentSalesProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'CASH': return 'bg-green-100 text-green-700';
      case 'CARD': return 'bg-blue-100 text-blue-700';
      case 'MOBILE': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-2 max-h-[280px] sm:max-h-[320px] overflow-y-auto">
      {sales.length === 0 ? (
        <p className="text-xs sm:text-sm text-default-400 text-center py-8">No recent sales</p>
      ) : (
        sales.map((sale) => (
          <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm text-[#242832]">{sale.invoice_number}</p>
              <p className="text-xs text-default-500">{formatDate(sale.created_at)}</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPaymentColor(sale.payment_method)}`}>
                {sale.payment_method}
              </span>
              <p className="font-bold text-sm min-w-[70px] sm:min-w-[80px] text-right text-[#242832]">
                ${sale.total_amount.toLocaleString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
