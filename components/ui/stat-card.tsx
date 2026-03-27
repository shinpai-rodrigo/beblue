'use client';

import { cn } from '@/lib/utils/format';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color?: 'blue' | 'green' | 'amber' | 'red' | 'emerald' | 'purple' | 'orange' | 'teal';
  className?: string;
}

const iconBgColors: Record<string, string> = {
  blue: 'bg-primary-100 text-primary-600',
  green: 'bg-success-100 text-success-600',
  amber: 'bg-warning-100 text-warning-600',
  red: 'bg-danger-100 text-danger-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  teal: 'bg-teal-100 text-teal-600',
};

const changeColors: Record<string, string> = {
  positive: 'text-success-600',
  negative: 'text-danger-600',
  neutral: 'text-slate-500',
};

function StatCard({
  icon,
  label,
  value,
  change,
  changeType = 'neutral',
  color = 'blue',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200 shadow-sm p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 truncate">{value}</p>
          {change && (
            <p className={cn('mt-1 text-sm font-medium', changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex-shrink-0 rounded-lg p-3',
            iconBgColors[color]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export { StatCard };
export type { StatCardProps };
