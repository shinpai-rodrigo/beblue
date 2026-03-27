'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch, apiPatch } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface CostCenter {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
}

export default function CentrosCustoPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, loading, error } = useFetch<any>(
    `/api/cost-centers${search ? `?search=${encodeURIComponent(search)}` : ''}`
  );

  const items: CostCenter[] = data?.data || data || [];

  const handleSearch = useCallback((v: string) => { setSearch(v); }, []);

  const columns: Column<CostCenter>[] = [
    { key: 'name', header: 'Nome', sortable: true, render: (i) => <span className="font-medium text-slate-900">{i.name}</span> },
    { key: 'code', header: 'Codigo', render: (i) => i.code || '-' },
    { key: 'description', header: 'Descricao', render: (i) => i.description || '-' },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Centros de Custo</h2>
        <Button onClick={() => router.push('/centros-custo/novo')}>
          <Plus className="h-4 w-4" /> Novo Centro de Custo
        </Button>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-200">
          <SearchInput onSearch={handleSearch} placeholder="Buscar por nome ou codigo..." className="max-w-md" />
        </div>
        {error ? (
          <div className="p-6 text-center text-sm text-danger-600">Erro: {error}</div>
        ) : (
          <DataTable columns={columns} data={items} loading={loading} keyExtractor={(i) => i.id} emptyMessage="Nenhum centro de custo cadastrado" />
        )}
      </Card>
    </div>
  );
}
