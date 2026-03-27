'use client';

import { AuthProvider } from '@/lib/context/auth-context';
import { ToastProvider } from '@/lib/context/toast-context';
import { ToastContainer } from '@/components/ui/toast-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}
