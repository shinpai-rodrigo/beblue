'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/format';

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function formatDisplay(cents: number): string {
  if (cents === 0) return '';
  const val = cents / 100;
  return val.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CurrencyInput({
  label,
  value,
  onChange,
  error,
  hint,
  disabled,
  className,
  id,
}: CurrencyInputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const [displayValue, setDisplayValue] = useState(
    value ? formatDisplay(Math.round(value * 100)) : ''
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      if (raw === '') {
        setDisplayValue('');
        onChange(0);
        return;
      }
      const cents = parseInt(raw, 10);
      const formatted = formatDisplay(cents);
      setDisplayValue(formatted);
      onChange(cents / 100);
    },
    [onChange]
  );

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <span className="text-sm text-slate-500 font-medium">R$</span>
        </div>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="0,00"
          className={cn(
            'block w-full rounded-lg border bg-white pl-10 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            error
              ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
              : 'border-slate-300',
            disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed'
          )}
        />
      </div>
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      {hint && !error && (
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export { CurrencyInput };
export type { CurrencyInputProps };
