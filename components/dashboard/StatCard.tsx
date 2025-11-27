'use client';

import { Card, CardBody } from '@heroui/react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' | 'default';
}

export default function StatCard({ title, value, subtitle, icon, trend, color = 'default' }: StatCardProps) {
  const colorClasses = {
    primary: 'border-l-4 border-primary',
    success: 'border-l-4 border-success',
    warning: 'border-l-4 border-warning',
    danger: 'border-l-4 border-danger',
    secondary: 'border-l-4 border-secondary',
    default: 'border-l-4 border-default',
  };

  return (
    <Card className={`${colorClasses[color]} shadow-sm hover:shadow-md transition-shadow`}>
      <CardBody className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-default-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
            {subtitle && <p className="text-xs text-default-400">{subtitle}</p>}
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={`text-xs font-medium ${
                    trend === 'up' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {trend === 'up' ? '↑' : '↓'}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex-shrink-0 ml-4">
              <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center text-2xl">
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
