'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/format';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
  className?: string;
}

function SkeletonRow({ cols }: { cols: number }) {
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

function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
  emptyDescription,
  onRowClick,
  keyExtractor,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = (() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (sortDir === 'asc') return strA.localeCompare(strB, 'pt-BR');
      return strB.localeCompare(strA, 'pt-BR');
    });
  })();

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider',
                  col.sortable && 'cursor-pointer select-none hover:text-slate-700',
                  col.headerClassName
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="inline-flex flex-col">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center"
              >
                <p className="text-sm font-medium text-slate-900">
                  {emptyMessage}
                </p>
                {emptyDescription && (
                  <p className="mt-1 text-sm text-slate-500">
                    {emptyDescription}
                  </p>
                )}
              </td>
            </tr>
          ) : (
            sortedData.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  'transition-colors duration-100',
                  onRowClick &&
                    'cursor-pointer hover:bg-slate-50'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-6 py-4 text-sm text-slate-700 whitespace-nowrap',
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(item)
                      : String((item as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
