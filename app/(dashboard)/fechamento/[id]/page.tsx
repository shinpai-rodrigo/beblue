'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFetch, apiPatch } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable, Column } from '@/components/ui/data-table';
import { PageLoading } from '@/components/ui/loading';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, ArrowDownCircle, ArrowUpCircle, Minus } from 'lucide-react';
import type { WeeklyClosingDetail, ClosingEntry } from '@/lib/types';

export default function FechamentoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.id as string;

  const { data: closing, loading, error, refetch } = useFetch<WeeklyClosingDetail>(`/api/weekly-closings/${id}`);

  if (loading) return <PageLoading />;
  if (error) return <div className="p-6 text-center text-danger-600">Erro: {error}</div>;
  if (!closing) return <div className="p-6 text-center text-slate-500">Fechamento nao encontrado</div>;

  const handleConciliate = async () => {
    const { error } = await apiPatch(`/api/weekly-closings/${id}`, { status: 'CONCILIADO' });
    if (error) { toast.error(error); }
    else { toast.success('Fechamento conciliado!'); refetch(); }
  };

  const handleClose = async () => {
    const { error } = await apiPatch(`/api/weekly-closings/${id}`, { status: 'FECHADO' });
    if (error) { toast.error(error); }
    else { toast.success('Fechamento finalizado!'); refetch(); }
  };

  const entryCols: Column<ClosingEntry>[] = [
    { key: 'description', header: 'Descricao', render: (i) => <span className="font-medium text-slate-900">{i.description}</span> },
    { key: 'type', header: 'Tipo', render: (i) => (
      <Badge variant={i.type === 'ENTRADA' ? 'success' : 'danger'}>
        {i.type === 'ENTRADA' ? 'Entrada' : 'Saida'}
      </Badge>
    )},
    { key: 'category', header: 'Categoria', render: (i) => i.category || '-' },
    { key: 'value', header: 'Valor', sortable: true, render: (i) => (
      <span className={i.type === 'ENTRADA' ? 'text-success-600 font-medium' : 'text-danger-600 font-medium'}>
        {i.type === 'ENTRADA' ? '+' : '-'} {formatCurrency(i.value)}
      </span>
    )},
  ];

  const diff = closing.difference;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/fechamento')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Semana {formatDate(closing.weekStart)} - {formatDate(closing.weekEnd)}
              </h2>
              <Badge>{closing.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {closing.status === 'ABERTO' && (
            <Button variant="outline" onClick={handleConciliate}>Conciliar</Button>
          )}
          {closing.status === 'CONCILIADO' && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Saldo Inicial" value={formatCurrency(closing.openingBalance)} color="blue" />
        <StatCard icon={<ArrowDownCircle className="h-5 w-5" />} label="Entradas" value={formatCurrency(closing.totalIncome)} color="green" />
        <StatCard icon={<ArrowUpCircle className="h-5 w-5" />} label="Saidas" value={formatCurrency(closing.totalExpenses)} color="red" />
        <StatCard
          icon={diff === 0 ? <Minus className="h-5 w-5" /> : diff > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          label="Diferenca"
          value={formatCurrency(diff)}
          color={diff === 0 ? 'green' : diff > 0 ? 'blue' : 'red'}
        />
      </div>

      {/* Comparison */}
      <Card title="Comparativo">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500 mb-1">Saldo Esperado</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(closing.expectedBalance)}</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500 mb-1">Saldo Real</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(closing.actualBalance)}</p>
          </div>
        </div>
        <div className={`mt-4 p-4 rounded-lg text-center ${diff === 0 ? 'bg-success-50' : diff > 0 ? 'bg-primary-50' : 'bg-danger-50'}`}>
          <p className="text-sm text-slate-600">Diferenca</p>
          <p className={`text-3xl font-bold ${diff === 0 ? 'text-success-600' : diff > 0 ? 'text-primary-600' : 'text-danger-600'}`}>
            {formatCurrency(diff)}
          </p>
        </div>
      </Card>

      {/* Entries */}
      <Card title="Detalhamento de Entradas e Saidas" noPadding>
        <DataTable
          columns={entryCols}
          data={closing.entries || []}
          keyExtractor={(i) => i.id}
          emptyMessage="Nenhuma entrada registrada"
        />
      </Card>
    </div>
  );
}
