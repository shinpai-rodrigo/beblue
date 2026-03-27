'use client';

import { useRouter } from 'next/navigation';
import { useFetch } from '@/lib/hooks/use-fetch';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface WeeklyClosing {
  id: string;
  weekStart: string;
  weekEnd: string;
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  status: string;
}

export default function FechamentoPage() {
  const router = useRouter();

  const { data, loading, error } = useFetch<any>('/api/weekly-closings');

  const items: WeeklyClosing[] = data?.data || data || [];

  const columns: Column<WeeklyClosing>[] = [
    {
      key: 'weekStart',
      header: 'Semana',
      sortable: true,
      render: (i) => (
        <span className="font-medium text-slate-900">
          {formatDate(i.weekStart)} - {formatDate(i.weekEnd)}
        </span>
      ),
    },
    { key: 'openingBalance', header: 'Saldo Inicial', render: (i) => formatCurrency(i.openingBalance) },
    { key: 'totalIncome', header: 'Entradas', render: (i) => <span className="text-success-600">{formatCurrency(i.totalIncome)}</span> },
    { key: 'totalExpenses', header: 'Saidas', render: (i) => <span className="text-danger-600">{formatCurrency(i.totalExpenses)}</span> },
    { key: 'expectedBalance', header: 'Esperado', render: (i) => formatCurrency(i.expectedBalance) },
    { key: 'actualBalance', header: 'Real', render: (i) => formatCurrency(i.actualBalance) },
    {
      key: 'difference',
      header: 'Diferenca',
      sortable: true,
      render: (i) => (
        <span className={`font-medium ${i.difference === 0 ? 'text-success-600' : i.difference > 0 ? 'text-primary-600' : 'text-danger-600'}`}>
          {formatCurrency(i.difference)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Fechamento Semanal</h2>
        <Button onClick={() => router.push('/fechamento/novo')}>
          <Plus className="h-4 w-4" /> Novo Fechamento
        </Button>
      </div>

      <Card noPadding>
        {error ? (
          <div className="p-6 text-center text-sm text-danger-600">Erro: {error}</div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            keyExtractor={(i) => i.id}
            onRowClick={(i) => router.push(`/fechamento/${i.id}`)}
            emptyMessage="Nenhum fechamento registrado"
            emptyDescription="Crie um novo fechamento semanal para comecar."
          />
        )}
      </Card>
    </div>
  );
}
