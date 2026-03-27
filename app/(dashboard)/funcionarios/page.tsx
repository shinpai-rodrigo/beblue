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

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  role: string;
  status: string;
}

const roleOptions = [
  { value: 'EXECUTIVO', label: 'Executivo' },
  { value: 'OPERACAO', label: 'Operacao' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function FuncionariosPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (search) queryParams.set('search', search);
  if (role) queryParams.set('role', role);

  const { data, loading, error } = useFetch<PaginatedResponse<Employee>>(
    `/api/employees?${queryParams.toString()}`
  );

  const employees = data?.data || [];
  const meta = data?.meta || { page: 1, limit, total: 0, totalPages: 1 };

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (item) => <span className="font-medium text-slate-900">{item.name}</span>,
    },
    { key: 'email', header: 'Email' },
    { key: 'position', header: 'Cargo', render: (item) => item.position || '-' },
    { key: 'department', header: 'Departamento', render: (item) => item.department || '-' },
    {
      key: 'role',
      header: 'Funcao',
      render: (item) => <Badge variant="info">{item.role}</Badge>,
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
        <h2 className="text-lg font-semibold text-slate-900">Funcionarios</h2>
        <Button onClick={() => router.push('/funcionarios/novo')}>
          <Plus className="h-4 w-4" />
          Novo Funcionario
        </Button>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <SearchInput
            onSearch={handleSearch}
            placeholder="Buscar por nome ou email..."
            className="flex-1"
          />
          <Select
            options={roleOptions}
            placeholder="Todas as funcoes"
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="w-48"
          />
        </div>

        {error ? (
          <div className="p-6 text-center text-sm text-danger-600">
            Erro ao carregar funcionarios: {error}
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={employees}
              loading={loading}
              keyExtractor={(item) => item.id}
              onRowClick={(item) => router.push(`/funcionarios/${item.id}`)}
              emptyMessage="Nenhum funcionario encontrado"
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
