'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>;
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  
  const formatMonth = (month: string) => {
    const date = new Date(month);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#049AE0" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#049AE0" stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          tickFormatter={formatMonth}
          tick={{ fontSize: 12, fill: '#6b7280' }}
        />
        <YAxis 
          tickFormatter={formatCurrency}
          tick={{ fontSize: 12, fill: '#6b7280' }}
        />
        <Tooltip 
          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
          labelFormatter={formatMonth}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          stroke="#049AE0" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorRevenue)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
