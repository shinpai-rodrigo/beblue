'use client';

import { useState, useCallback } from 'react';
import { useFetch, apiPatch } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DataTable, Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Percent, CheckCircle2, CreditCard } from 'lucide-react';
import type { PaginatedResponse } from '@/lib/types';

interface Commission {
  id: string;
  campaignId: string;
  campaignName: string;
  employeeName: string;
  role: string;
  basis: string;
  percentage: number;
  calculatedValue: number;
  status: string;
}

interface CommissionSummary {
  totalCalculated: number;
  totalApproved: number;
  totalPaid: number;
}

const statusOptions = [
  { value: 'CALCULADA', label: 'Calculada' },
  { value: 'APROVADA', label: 'Aprovada' },
  { value: 'PAGA', label: 'Paga' },
];

export default function ComissoesPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (search) queryParams.set('search', search);
  if (status) queryParams.set('status', status);

  const { data, loading, error, refetch } = useFetch<PaginatedResponse<Commission> & { summary?: CommissionSummary }>(
    `/api/commissions?${queryParams.toString()}`
  );

  const items = data?.data || [];
  const meta = data?.meta || { page: 1, limit, total: 0, totalPages: 1 };
  const summary = data?.summary || { totalCalculated: 0, totalApproved: 0, totalPaid: 0 };

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  const handleAction = async (id: string, action: 'approve' | 'pay') => {
    const newStatus = action === 'approve' ? 'APROVADA' : 'PAGA';
    const { error } = await apiPatch(`/api/commissions/${id}`, { status: newStatus });
    if (error) { toast.error(error); }
    else { toast.success(`Comissao ${action === 'approve' ? 'aprovada' : 'paga'}!`); refetch(); }
  };

  const columns: Column<Commission>[] = [
    { key: 'campaignName', header: 'Campanha', sortable: true, render: (i) => <span className="font-medium text-slate-900">{i.campaignName}</span> },
    { key: 'employeeName', header: 'Funcionario', sortable: true },
    { key: 'basis', header: 'Base' },
    { key: 'percentage', header: 'Percentual', render: (i) => `${i.percentage}%` },
    { key: 'calculatedValue', header: 'Valor', sortable: true, render: (i) => <span className="font-medium">{formatCurrency(i.calculatedValue)}</span> },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'actions', header: 'Acoes', render: (i) => (
      <div className="flex gap-1">
        {i.status === 'CALCULADA' && (
          <Button variant="ghost" size="sm" onClick={() => handleAction(i.id, 'approve')}>
            <CheckCircle2 className="h-3.5 w-3.5 text-success-600" /> Aprovar
          </Button>
        )}
        {i.status === 'APROVADA' && (
          <Button variant="ghost" size="sm" onClick={() => handleAction(i.id, 'pay')}>
            <CreditCard className="h-3.5 w-3.5 text-primary-600" /> Pagar
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Comissoes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Percent className="h-5 w-5" />} label="Total Calculada" value={formatCurrency(summary.totalCalculated)} color="amber" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Total Aprovada" value={formatCurrency(summary.totalApproved)} color="blue" />
        <StatCard icon={<CreditCard className="h-5 w-5" />} label="Total Paga" value={formatCurrency(summary.totalPaid)} color="green" />
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <SearchInput onSearch={handleSearch} placeholder="Buscar por campanha ou funcionario..." className="flex-1" />
          <Select options={statusOptions} placeholder="Todos os status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-48" />
        </div>
        {error ? (
          <div className="p-6 text-center text-sm text-danger-600">Erro: {error}</div>
        ) : (
          <>
            <DataTable columns={columns} data={items} loading={loading} keyExtractor={(i) => i.id} emptyMessage="Nenhuma comissao encontrada" />
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
