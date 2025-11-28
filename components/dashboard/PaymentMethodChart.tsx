'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentData {
  payment_method: string;
  total: number;
}

interface PaymentMethodChartProps {
  data: PaymentData[];
}

const COLORS = {
  CASH: '#10b981',
  CARD: '#049AE0',
  MOBILE: '#8b5cf6',
  BANK_TRANSFER: '#f59e0b',
  OTHER: '#6b7280'
};

export default function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const chartData = data.map(item => ({
    name: item.payment_method,
    value: item.total
  }));

  const formatCurrency = (value: number) => `₱${value.toLocaleString()}`;

  return (
    <div>
      {chartData.length === 0 ? (
        <p className="text-sm text-default-400 text-center py-8">No payment data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.OTHER} 
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
