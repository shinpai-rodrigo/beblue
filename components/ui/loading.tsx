'use client';

import { cn } from '@/lib/utils/format';
import { Loader2 } from 'lucide-react';

function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-6 w-6 animate-spin text-primary-600', className)} />;
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-4 bg-slate-200 rounded animate-pulse', className)}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-3 bg-slate-200 rounded w-24" />
          <div className="h-7 bg-slate-200 rounded w-32" />
        </div>
        <div className="h-12 w-12 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="h-10 w-10" />
        <p className="text-sm text-slate-500">Carregando...</p>
      </div>
    </div>
  );
}

export { Spinner, SkeletonLine, SkeletonCard, SkeletonTableRow, PageLoading };
