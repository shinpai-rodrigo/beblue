'use client';

import { useState } from 'react';
import { useFetch, apiPatch } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ArrowUpCircle, CheckCircle2 } from 'lucide-react';

interface PayableData {
  influencerPayments: Array<{
    id: string;
    influencerName: string;
    campaignName: string;
    campaignId: string;
    influencerId: string;
    openValue: number;
    status: string;
  }>;
  reimbursements: Array<{
    id: string;
    employeeName: string;
    campaignName: string;
    category: string;
    approvedValue: number;
    status: string;
  }>;
  commissions: Array<{
    id: string;
    employeeName: string;
    campaignName: string;
    campaignId: string;
    calculatedValue: number;
    status: string;
  }>;
  summary: {
    totalPayable: number;
    totalPaid: number;
  };
}

export default function PagarPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('influenciadores');
  const { data, loading, error, refetch } = useFetch<PayableData>('/api/payables');

  const [showPayModal, setShowPayModal] = useState(false);
  const [payContext, setPayContext] = useState<{ type: string; id: string; campaignId?: string; influencerId?: string; name: string; value: number } | null>(null);
  const [payForm, setPayForm] = useState({ value: 0, paymentDate: '' });
  const [modalLoading, setModalLoading] = useState(false);

  const d = data || { influencerPayments: [], reimbursements: [], commissions: [], summary: { totalPayable: 0, totalPaid: 0 } };

  const tabs = [
    { key: 'influenciadores', label: 'Influenciadores', count: d.influencerPayments.length },
    { key: 'reembolsos', label: 'Reembolsos', count: d.reimbursements.length },
    { key: 'comissoes', label: 'Comissoes', count: d.commissions.length },
  ];

  const openPay = (type: string, item: any) => {
    setPayContext({
      type,
      id: item.id,
      campaignId: item.campaignId,
      influencerId: item.influencerId,
      name: item.influencerName || item.employeeName || '',
      value: item.openValue || item.approvedValue || item.calculatedValue || 0,
    });
    setPayForm({ value: 0, paymentDate: '' });
    setShowPayModal(true);
  };

  const handlePay = async () => {
    if (!payContext || payForm.value <= 0 || !payForm.paymentDate) {
      toast.error('Preencha valor e data');
      return;
    }
    setModalLoading(true);
    let result;
    if (payContext.type === 'influencer') {
      result = await apiPatch(`/api/campaigns/${payContext.campaignId}/influencers/${payContext.influencerId}/payments`, {
        value: payForm.value,
        paymentDate: payForm.paymentDate,
      });
    } else if (payContext.type === 'reimbursement') {
      result = await apiPatch(`/api/reimbursements/${payContext.id}`, {
        status: 'PAGO',
        paidValue: payForm.value,
        paidDate: payForm.paymentDate,
      });
    } else {
      result = await apiPatch(`/api/commissions/${payContext.id}`, {
        status: 'PAGA',
        paidDate: payForm.paymentDate,
      });
    }
    setModalLoading(false);
    if (result.error) { toast.error(result.error); }
    else { toast.success('Pagamento registrado!'); setShowPayModal(false); refetch(); }
  };

  const influencerCols: Column<PayableData['influencerPayments'][0]>[] = [
    { key: 'influencerName', header: 'Influenciador', sortable: true, render: (i) => <span className="font-medium text-slate-900">{i.influencerName}</span> },
    { key: 'campaignName', header: 'Campanha' },
    { key: 'openValue', header: 'Valor Pendente', sortable: true, render: (i) => <span className="font-medium text-warning-600">{formatCurrency(i.openValue)}</span> },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'actions', header: '', render: (i) => (
      <Button variant="ghost" size="sm" onClick={() => openPay('influencer', i)}>Pagar</Button>
    )},
  ];

  const reimbursementCols: Column<PayableData['reimbursements'][0]>[] = [
    { key: 'employeeName', header: 'Funcionario', sortable: true, render: (i) => <span className="font-medium text-slate-900">{i.employeeName}</span> },
    { key: 'category', header: 'Categoria' },
    { key: 'campaignName', header: 'Campanha', render: (i) => i.campaignName || '-' },
    { key: 'approvedValue', header: 'Valor Aprovado', render: (i) => formatCurrency(i.approvedValue) },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'actions', header: '', render: (i) => (
      <Button variant="ghost" size="sm" onClick={() => openPay('reimbursement', i)}>Pagar</Button>
    )},
  ];

  const commissionCols: Column<PayableData['commissions'][0]>[] = [
    { key: 'employeeName', header: 'Funcionario', sortable: true, render: (i) => <span className="font-medium text-slate-900">{i.employeeName}</span> },
    { key: 'campaignName', header: 'Campanha' },
    { key: 'calculatedValue', header: 'Valor', render: (i) => formatCurrency(i.calculatedValue) },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'actions', header: '', render: (i) => (
      <Button variant="ghost" size="sm" onClick={() => openPay('commission', i)}>Pagar</Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Contas a Pagar</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={<ArrowUpCircle className="h-5 w-5" />} label="Total a Pagar" value={formatCurrency(d.summary.totalPayable)} color="red" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Total Pago" value={formatCurrency(d.summary.totalPaid)} color="green" />
      </div>

      <Card noPadding>
        <div className="px-6 pt-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {error ? (
          <div className="p-6 text-center text-sm text-danger-600">Erro: {error}</div>
        ) : (
          <>
            {activeTab === 'influenciadores' && (
              <DataTable columns={influencerCols} data={d.influencerPayments} loading={loading} keyExtractor={(i) => i.id} emptyMessage="Nenhum pagamento pendente a influenciadores" />
            )}
            {activeTab === 'reembolsos' && (
              <DataTable columns={reimbursementCols} data={d.reimbursements} loading={loading} keyExtractor={(i) => i.id} emptyMessage="Nenhum reembolso pendente de pagamento" />
            )}
            {activeTab === 'comissoes' && (
              <DataTable columns={commissionCols} data={d.commissions} loading={loading} keyExtractor={(i) => i.id} emptyMessage="Nenhuma comissao pendente de pagamento" />
            )}
          </>
        )}
      </Card>

      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="Registrar Pagamento"
        footer={<><Button variant="ghost" onClick={() => setShowPayModal(false)}>Cancelar</Button><Button onClick={handlePay} loading={modalLoading}>Registrar Pagamento</Button></>}>
        <div className="space-y-4">
          {payContext && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p><span className="text-slate-500">Para:</span> <span className="font-medium">{payContext.name}</span></p>
              <p><span className="text-slate-500">Valor pendente:</span> <span className="font-medium">{formatCurrency(payContext.value)}</span></p>
            </div>
          )}
          <CurrencyInput label="Valor *" value={payForm.value} onChange={(v) => setPayForm({ ...payForm, value: v })} />
          <Input label="Data *" type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
