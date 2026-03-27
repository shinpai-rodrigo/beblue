'use client';

import { createContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => removeToast(id), 5000);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string) => addToast({ type: 'success', message }),
    [addToast]
  );
  const error = useCallback(
    (message: string) => addToast({ type: 'error', message }),
    [addToast]
  );
  const warning = useCallback(
    (message: string) => addToast({ type: 'warning', message }),
    [addToast]
  );
  const info = useCallback(
    (message: string) => addToast({ type: 'info', message }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
    </ToastContext.Provider>
  );
}
