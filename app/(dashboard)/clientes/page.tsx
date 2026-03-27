'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch } from '@/lib/hooks/use-fetch';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DataTable, Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import type { PaginatedResponse } from '@/lib/types';

interface Client {
  id: string;
  name: string;
  tradeName: string | null;
  document: string;
  email: string | null;
  phone: string | null;
  status: string;
  _count?: { campaigns: number };
}

export default function ClientesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (search) queryParams.set('search', search);
  if (status) queryParams.set('status', status);

  const { data, loading, error } = useFetch<PaginatedResponse<Client>>(
    `/api/clients?${queryParams.toString()}`
  );

  const clients = data?.data || [];
  const meta = data?.meta || { page: 1, limit, total: 0, totalPages: 1 };

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.name}</p>
          {item.tradeName && (
            <p className="text-xs text-slate-500">{item.tradeName}</p>
          )}
        </div>
      ),
    },
    { key: 'document', header: 'Documento', sortable: true },
    { key: 'email', header: 'Email', render: (item) => item.email || '-' },
    { key: 'phone', header: 'Telefone', render: (item) => item.phone || '-' },
    {
      key: 'campaigns',
      header: 'Campanhas',
      render: (item) => (
        <span className="text-slate-600">{item._count?.campaigns || 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <Badge>{item.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Clientes</h2>
        <Button onClick={() => router.push('/clientes/novo')}>
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <SearchInput
            onSearch={handleSearch}
            placeholder="Buscar por nome, documento ou email..."
            className="flex-1"
          />
          <Select
            options={[
              { value: 'ATIVO', label: 'Ativo' },
              { value: 'INATIVO', label: 'Inativo' },
            ]}
            placeholder="Todos os status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-48"
          />
        </div>

        {error ? (
          <div className="p-6 text-center text-sm text-danger-600">
            Erro ao carregar clientes: {error}
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={clients}
              loading={loading}
              keyExtractor={(item) => item.id}
              onRowClick={(item) => router.push(`/clientes/${item.id}`)}
              emptyMessage="Nenhum cliente encontrado"
              emptyDescription="Crie um novo cliente para comecar."
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
