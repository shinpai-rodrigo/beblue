'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch, apiPatch } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DataTable, Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ArrowDownCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { PaginatedResponse } from '@/lib/types';

interface Receivable {
  id: string;
  campaignId: string;
  campaignName: string;
  clientName: string;
  invoiceNumber: string | null;
  value: number;
  dueDate: string;
  status: string;
  receivedValue: number | null;
  receivedDate: string | null;
}

interface ReceivableSummary {
  totalReceivable: number;
  totalReceived: number;
  totalOverdue: number;
}

export default function ReceberPage() {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Receivable | null>(null);
  const [receiveForm, setReceiveForm] = useState({ receivedValue: 0, receivedDate: '' });
  const [modalLoading, setModalLoading] = useState(false);

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (search) queryParams.set('search', search);
  if (status) queryParams.set('status', status);
  if (startDate) queryParams.set('startDate', startDate);
  if (endDate) queryParams.set('endDate', endDate);

  const { data, loading, error, refetch } = useFetch<PaginatedResponse<Receivable> & { summary?: ReceivableSummary }>(
    `/api/receivables?${queryParams.toString()}`
  );

  const receivables = data?.data || [];
  const meta = data?.meta || { page: 1, limit, total: 0, totalPages: 1 };
  const summary = data?.summary || { totalReceivable: 0, totalReceived: 0, totalOverdue: 0 };

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  const handleReceive = async () => {
    if (!selected || receiveForm.receivedValue <= 0 || !receiveForm.receivedDate) {
      toast.error('Preencha valor e data');
      return;
    }
    setModalLoading(true);
    const { error } = await apiPatch(
      `/api/campaigns/${selected.campaignId}/receivables/${selected.id}`,
      { ...receiveForm, status: 'RECEBIDO' }
    );
    setModalLoading(false);
    if (error) { toast.error(error); }
    else { toast.success('Recebimento registrado!'); setShowModal(false); refetch(); }
  };

  const isOverdue = (item: Receivable) => {
    return item.status !== 'RECEBIDO' && new Date(item.dueDate) < new Date();
  };

  const columns: Column<Receivable>[] = [
    { key: 'campaignName', header: 'Campanha', sortable: true,
      render: (i) => <span className="font-medium text-slate-900 cursor-pointer hover:text-primary-600" onClick={(e) => { e.stopPropagation(); router.push(`/campanhas/${i.campaignId}`); }}>{i.campaignName}</span> },
    { key: 'clientName', header: 'Cliente', sortable: true },
    { key: 'invoiceNumber', header: 'NF', render: (i) => i.invoiceNumber || '-' },
    { key: 'value', header: 'Valor', sortable: true, render: (i) => formatCurrency(i.value) },
    { key: 'dueDate', header: 'Vencimento', sortable: true, render: (i) => (
      <span className={isOverdue(i) ? 'text-danger-600 font-medium' : ''}>
        {formatDate(i.dueDate)}
        {isOverdue(i) && <span className="ml-1 text-xs">(vencido)</span>}
      </span>
    )},
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'receivedValue', header: 'Recebido', render: (i) => i.receivedValue != null ? formatCurrency(i.receivedValue) : '-' },
    { key: 'actions', header: '', render: (i) => (
      i.status !== 'RECEBIDO' ? (
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation();
          setSelected(i);
          setReceiveForm({ receivedValue: 0, receivedDate: '' });
          setShowModal(true);
        }}>
          Receber
        </Button>
      ) : null
    )},
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Contas a Receber</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<ArrowDownCircle className="h-5 w-5" />} label="Total a Receber" value={formatCurrency(summary.totalReceivable)} color="amber" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Total Recebido" value={formatCurrency(summary.totalReceived)} color="green" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Total Vencido" value={formatCurrency(summary.totalOverdue)} color="red" />
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput onSearch={handleSearch} placeholder="Buscar por campanha ou cliente..." className="flex-1" />
            <Select
              options={[
                { value: 'PENDENTE', label: 'Pendente' },
                { value: 'RECEBIDO', label: 'Recebido' },
                { value: 'VENCIDO', label: 'Vencido' },
              ]}
              placeholder="Todos os status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-48"
            />
          </div>
          <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} label="Vencimento" />
        </div>

        {error ? (
          <div className="p-6 text-center text-sm text-danger-600">Erro: {error}</div>
        ) : (
          <>
            <DataTable columns={columns} data={receivables} loading={loading} keyExtractor={(i) => i.id} emptyMessage="Nenhum recebimento encontrado" />
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Recebimento"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button><Button onClick={handleReceive} loading={modalLoading}>Registrar</Button></>}>
        <div className="space-y-4">
          {selected && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
              <p><span className="text-slate-500">Campanha:</span> <span className="font-medium">{selected.campaignName}</span></p>
              <p><span className="text-slate-500">NF:</span> <span className="font-medium">{selected.invoiceNumber || '-'}</span></p>
              <p><span className="text-slate-500">Valor:</span> <span className="font-medium">{formatCurrency(selected.value)}</span></p>
            </div>
          )}
          <CurrencyInput label="Valor Recebido *" value={receiveForm.receivedValue} onChange={(v) => setReceiveForm({ ...receiveForm, receivedValue: v })} />
          <Input label="Data do Recebimento *" type="date" value={receiveForm.receivedDate} onChange={(e) => setReceiveForm({ ...receiveForm, receivedDate: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
