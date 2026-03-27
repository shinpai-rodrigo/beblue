'use client';

import { cn } from '@/lib/utils/format';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast as ToastType, ToastType as TType } from '@/lib/context/toast-context';

const iconMap: Record<TType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success-500" />,
  error: <XCircle className="h-5 w-5 text-danger-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-500" />,
  info: <Info className="h-5 w-5 text-primary-500" />,
};

const bgMap: Record<TType, string> = {
  success: 'border-success-200 bg-success-50',
  error: 'border-danger-200 bg-danger-50',
  warning: 'border-warning-200 bg-warning-50',
  info: 'border-primary-200 bg-primary-50',
};

interface ToastItemProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 w-80 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right',
        bgMap[toast.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{iconMap[toast.type]}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
        )}
        <p className="text-sm text-slate-700">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export { ToastItem };
