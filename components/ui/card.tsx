'use client';

import { cn } from '@/lib/utils/format';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

function Card({
  children,
  className,
  title,
  subtitle,
  action,
  footer,
  noPadding,
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-slate-200 shadow-sm',
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-6')}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}

export { Card };
export type { CardProps };
