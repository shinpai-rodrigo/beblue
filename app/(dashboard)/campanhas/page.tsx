'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch } from '@/lib/hooks/use-fetch';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DataTable, Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import type { PaginatedResponse } from '@/lib/types';

interface Campaign {
  id: string;
  name: string;
  status: string;
  soldValue: number;
  clientName: string;
  executiveName: string | null;
  startDate: string | null;
  endDate: string | null;
  margin: number;
  marginPercent: number;
}

const statusOptions = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'PAUSADA', label: 'Pausada' },
  { value: 'ENCERRADA', label: 'Encerrada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export default function CampanhasPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (search) queryParams.set('search', search);
  if (status) queryParams.set('status', status);
  if (startDate) queryParams.set('startDate', startDate);
  if (endDate) queryParams.set('endDate', endDate);

  const { data, loading, error } = useFetch<PaginatedResponse<Campaign>>(
    `/api/campaigns?${queryParams.toString()}`
  );

  const campaigns = data?.data || [];
  const meta = data?.meta || { page: 1, limit, total: 0, totalPages: 1 };

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<Campaign>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (item) => (
        <span className="font-medium text-slate-900">{item.name}</span>
      ),
    },
    { key: 'clientName', header: 'Cliente', sortable: true },
    {
      key: 'soldValue',
      header: 'Vendido',
      sortable: true,
      render: (item) => (
        <span className="font-medium">{formatCurrency(item.soldValue)}</span>
      ),
    },
    {
      key: 'margin',
      header: 'Margem',
      sortable: true,
      render: (item) => (
        <div>
          <span className={`font-medium ${item.margin >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {formatCurrency(item.margin)}
          </span>
          <span className={`ml-1 text-xs ${item.marginPercent >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
            ({item.marginPercent?.toFixed(1) || '0.0'}%)
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <Badge>{item.status}</Badge>,
    },
    {
      key: 'executiveName',
      header: 'Executivo',
      render: (item) => item.executiveName || '-',
    },
    {
      key: 'startDate',
      header: 'Periodo',
      render: (item) => {
        if (!item.startDate) return '-';
        const start = formatDate(item.startDate);
        const end = item.endDate ? formatDate(item.endDate) : '...';
        return <span className="text-xs">{start} - {end}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Campanhas</h2>
        <Button onClick={() => router.push('/campanhas/nova')}>
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              onSearch={handleSearch}
              placeholder="Buscar por nome ou cliente..."
              className="flex-1"
            />
            <Select
              options={statusOptions}
              placeholder="Todos os status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-48"
            />
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={(d) => { setStartDate(d); setPage(1); }}
            onEndChange={(d) => { setEndDate(d); setPage(1); }}
            label="Filtrar por periodo"
          />
        </div>

        {error ? (
          <div className="p-6 text-center text-sm text-danger-600">
            Erro ao carregar campanhas: {error}
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={campaigns}
              loading={loading}
              keyExtractor={(item) => item.id}
              onRowClick={(item) => router.push(`/campanhas/${item.id}`)}
              emptyMessage="Nenhuma campanha encontrada"
              emptyDescription="Crie uma nova campanha para comecar."
            />
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
