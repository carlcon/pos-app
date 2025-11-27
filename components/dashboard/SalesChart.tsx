'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SalesChartProps {
  data: Array<{
    date: string;
    total: number;
    count: number;
  }>;
  title?: string;
  type?: 'line' | 'bar';
}

export default function SalesChart({ data, type = 'line' }: SalesChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      {type === 'line' ? (
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#049AE0"
            strokeWidth={3}
            name="Sales Amount"
            dot={{ fill: '#049AE0', r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#10b981"
            strokeWidth={3}
            name="Transactions"
            dot={{ fill: '#10b981', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      ) : (
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="total" fill="#049AE0" name="Sales Amount" radius={[8, 8, 0, 0]} />
          <Bar dataKey="count" fill="#10b981" name="Transactions" radius={[8, 8, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
