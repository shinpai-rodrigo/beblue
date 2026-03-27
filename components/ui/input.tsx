'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/format';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              error
                ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
                : 'border-slate-300',
              icon && 'pl-10',
              props.disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
        {hint && !error && (
          <p className="mt-1 text-sm text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
