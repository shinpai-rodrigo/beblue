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
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Plus, Eye, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import type { PaginatedResponse } from '@/lib/types';

interface Reimbursement {
  id: string;
  employeeName: string;
  employeeId: string;
  category: string;
  campaignName: string | null;
  requestedValue: number;
  approvedValue: number | null;
  paidValue: number | null;
  status: string;
  date: string;
  description: string | null;
}

const statusOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_ANALISE', label: 'Em Analise' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'REJEITADO', label: 'Rejeitado' },
  { value: 'PAGO', label: 'Pago' },
];

const categoryOptions = [
  { value: 'ALIMENTACAO', label: 'Alimentacao' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'HOSPEDAGEM', label: 'Hospedagem' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'OUTROS', label: 'Outros' },
];

export default function ReembolsosPage() {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [actionModal, setActionModal] = useState<{ item: Reimbursement; action: string } | null>(null);
  const [approvedValue, setApprovedValue] = useState(0);
  const [rejectReason, setRejectReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  if (search) queryParams.set('search', search);
  if (status) queryParams.set('status', status);
  if (category) queryParams.set('category', category);
  if (startDate) queryParams.set('startDate', startDate);
  if (endDate) queryParams.set('endDate', endDate);

  const { data, loading, error, refetch } = useFetch<PaginatedResponse<Reimbursement>>(
    `/api/reimbursements?${queryParams.toString()}`
  );

  const items = data?.data || [];
  const meta = data?.meta || { page: 1, limit, total: 0, totalPages: 1 };

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);

  const handleAction = async () => {
    if (!actionModal) return;
    const { item, action } = actionModal;

    setModalLoading(true);
    let payload: any = {};
    if (action === 'approve') {
      payload = { status: 'APROVADO', approvedValue: approvedValue || item.requestedValue };
    } else if (action === 'reject') {
      payload = { status: 'REJEITADO', rejectionReason: rejectReason };
    } else if (action === 'pay') {
      payload = { status: 'PAGO' };
    } else if (action === 'analyze') {
      payload = { status: 'EM_ANALISE' };
    }

    const { error } = await apiPatch(`/api/reimbursements/${item.id}`, payload);
    setModalLoading(false);

    if (error) { toast.error(error); }
    else {
      const msgs: Record<string, string> = { approve: 'Reembolso aprovado!', reject: 'Reembolso rejeitado!', pay: 'Reembolso pago!', analyze: 'Em analise!' };
      toast.success(msgs[action] || 'Atualizado!');
      setActionModal(null);
      refetch();
    }
  };

  const columns: Column<Reimbursement>[] = [
    { key: 'employeeName', header: 'Funcionario', sortable: true, render: (i) => <span className="font-medium text-slate-900">{i.employeeName}</span> },
    { key: 'category', header: 'Categoria', render: (i) => i.category.replace(/_/g, ' ') },
    { key: 'campaignName', header: 'Campanha', render: (i) => i.campaignName || '-' },
    { key: 'requestedValue', header: 'Solicitado', sortable: true, render: (i) => formatCurrency(i.requestedValue) },
    { key: 'approvedValue', header: 'Aprovado', render: (i) => i.approvedValue != null ? formatCurrency(i.approvedValue) : '-' },
    { key: 'paidValue', header: 'Pago', render: (i) => i.paidValue != null ? formatCurrency(i.paidValue) : '-' },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'date', header: 'Data', sortable: true, render: (i) => formatDate(i.date) },
    {
      key: 'actions', header: 'Acoes', render: (i) => (
        <div className="flex gap-1">
          {i.status === 'PENDENTE' && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setActionModal({ item: i, action: 'analyze' }); }}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {(i.status === 'PENDENTE' || i.status === 'EM_ANALISE') && (
            <>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setApprovedValue(i.requestedValue); setActionModal({ item: i, action: 'approve' }); }}>
                <CheckCircle2 className="h-3.5 w-3.5 text-success-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setRejectReason(''); setActionModal({ item: i, action: 'reject' }); }}>
                <XCircle className="h-3.5 w-3.5 text-danger-600" />
              </Button>
            </>
          )}
          {i.status === 'APROVADO' && (
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setActionModal({ item: i, action: 'pay' }); }}>
              <CreditCard className="h-3.5 w-3.5 text-primary-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const getModalTitle = () => {
    if (!actionModal) return '';
    const map: Record<string, string> = { approve: 'Aprovar Reembolso', reject: 'Rejeitar Reembolso', pay: 'Registrar Pagamento', analyze: 'Iniciar Analise' };
    return map[actionModal.action] || 'Acao';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Reembolsos</h2>
        <Button onClick={() => router.push('/reembolsos/novo')}>
          <Plus className="h-4 w-4" /> Novo Reembolso
        </Button>
      </div>

      <Card noPadding>
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput onSearch={handleSearch} placeholder="Buscar por funcionario..." className="flex-1" />
            <Select options={statusOptions} placeholder="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40" />
            <Select options={categoryOptions} placeholder="Categoria" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-40" />
          </div>
          <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
        </div>
        {error ? (
          <div className="p-6 text-center text-sm text-danger-600">Erro: {error}</div>
        ) : (
          <>
            <DataTable columns={columns} data={items} loading={loading} keyExtractor={(i) => i.id} emptyMessage="Nenhum reembolso encontrado" />
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title={getModalTitle()}
        footer={<><Button variant="ghost" onClick={() => setActionModal(null)}>Cancelar</Button><Button variant={actionModal?.action === 'reject' ? 'danger' : 'primary'} onClick={handleAction} loading={modalLoading}>Confirmar</Button></>}>
        {actionModal && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm space-y-1">
              <p><span className="text-slate-500">Funcionario:</span> <span className="font-medium">{actionModal.item.employeeName}</span></p>
              <p><span className="text-slate-500">Categoria:</span> <span className="font-medium">{actionModal.item.category}</span></p>
              <p><span className="text-slate-500">Valor solicitado:</span> <span className="font-medium">{formatCurrency(actionModal.item.requestedValue)}</span></p>
              {actionModal.item.description && <p><span className="text-slate-500">Descricao:</span> {actionModal.item.description}</p>}
            </div>
            {actionModal.action === 'approve' && (
              <CurrencyInput label="Valor Aprovado" value={approvedValue} onChange={setApprovedValue} />
            )}
            {actionModal.action === 'reject' && (
              <Textarea label="Motivo da Rejeicao" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Informe o motivo..." rows={3} />
            )}
            {actionModal.action === 'analyze' && (
              <p className="text-sm text-slate-600">Confirma que deseja iniciar a analise deste reembolso?</p>
            )}
            {actionModal.action === 'pay' && (
              <p className="text-sm text-slate-600">Confirma o pagamento de <span className="font-medium">{formatCurrency(actionModal.item.approvedValue || actionModal.item.requestedValue)}</span>?</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
