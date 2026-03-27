'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFetch, apiPost, apiPatch } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { DataTable, Column } from '@/components/ui/data-table';
import { PageLoading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowLeft,
  DollarSign,
  Users,
  Receipt,
  TrendingUp,
  Percent,
  ArrowDownCircle,
  CheckCircle2,
  Plus,
  CreditCard,
  FileText,
  Clock,
} from 'lucide-react';
import type { CampaignDetail, InfluencerDetail, ReceivableDetail, ReimbursementDetail, CommissionDetail } from '@/lib/types';

export default function CampanhaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.id as string;

  const { data: campaign, loading, error, refetch } = useFetch<CampaignDetail>(`/api/campaigns/${id}`);
  const [activeTab, setActiveTab] = useState('resumo');

  // Modal states
  const [showInfluencerModal, setShowInfluencerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceivableModal, setShowReceivableModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerDetail | null>(null);
  const [selectedReceivable, setSelectedReceivable] = useState<ReceivableDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Influencer form
  const [influencerForm, setInfluencerForm] = useState({ name: '', socialHandle: '', negotiatedValue: 0 });
  // Payment form
  const [paymentForm, setPaymentForm] = useState({ value: 0, paymentDate: '', paymentMethod: '', notes: '' });
  // Receivable form
  const [receivableForm, setReceivableForm] = useState({ invoiceNumber: '', value: 0, dueDate: '' });
  // Receive form
  const [receiveForm, setReceiveForm] = useState({ receivedValue: 0, receivedDate: '' });
  // Reimbursement form
  const [reimbursementForm, setReimbursementForm] = useState({ category: '', requestedValue: 0, description: '' });

  if (loading) return <PageLoading />;
  if (error) return <div className="p-6 text-center text-danger-600">Erro: {error}</div>;
  if (!campaign) return <div className="p-6 text-center text-slate-500">Campanha nao encontrada</div>;

  const t = campaign.totals;

  const tabs = [
    { key: 'resumo', label: 'Resumo' },
    { key: 'influenciadores', label: 'Influenciadores', count: campaign.influencers?.length || 0 },
    { key: 'recebimentos', label: 'Recebimentos', count: campaign.receivables?.length || 0 },
    { key: 'reembolsos', label: 'Reembolsos', count: campaign.reimbursements?.length || 0 },
    { key: 'comissoes', label: 'Comissoes', count: campaign.commissions?.length || 0 },
    { key: 'historico', label: 'Historico' },
  ];

  // --- Handlers ---

  const handleAddInfluencer = async () => {
    if (!influencerForm.name.trim() || influencerForm.negotiatedValue <= 0) {
      toast.error('Preencha o nome e valor negociado');
      return;
    }
    setModalLoading(true);
    const { error } = await apiPost(`/api/campaigns/${id}/influencers`, influencerForm);
    setModalLoading(false);
    if (error) { toast.error(error); }
    else {
      toast.success('Influenciador adicionado!');
      setShowInfluencerModal(false);
      setInfluencerForm({ name: '', socialHandle: '', negotiatedValue: 0 });
      refetch();
    }
  };

  const handleAddPayment = async () => {
    if (!selectedInfluencer || paymentForm.value <= 0 || !paymentForm.paymentDate) {
      toast.error('Preencha valor e data do pagamento');
      return;
    }
    setModalLoading(true);
    const { error } = await apiPost(
      `/api/campaigns/${id}/influencers/${selectedInfluencer.id}/payments`,
      paymentForm
    );
    setModalLoading(false);
    if (error) { toast.error(error); }
    else {
      toast.success('Pagamento registrado!');
      setShowPaymentModal(false);
      setPaymentForm({ value: 0, paymentDate: '', paymentMethod: '', notes: '' });
      setSelectedInfluencer(null);
      refetch();
    }
  };

  const handleAddReceivable = async () => {
    if (receivableForm.value <= 0 || !receivableForm.dueDate) {
      toast.error('Preencha valor e data de vencimento');
      return;
    }
    setModalLoading(true);
    const { error } = await apiPost(`/api/campaigns/${id}/receivables`, receivableForm);
    setModalLoading(false);
    if (error) { toast.error(error); }
    else {
      toast.success('Nota fiscal adicionada!');
      setShowReceivableModal(false);
      setReceivableForm({ invoiceNumber: '', value: 0, dueDate: '' });
      refetch();
    }
  };

  const handleReceive = async () => {
    if (!selectedReceivable || receiveForm.receivedValue <= 0 || !receiveForm.receivedDate) {
      toast.error('Preencha valor e data do recebimento');
      return;
    }
    setModalLoading(true);
    const { error } = await apiPatch(
      `/api/campaigns/${id}/receivables/${selectedReceivable.id}`,
      { ...receiveForm, status: 'RECEBIDO' }
    );
    setModalLoading(false);
    if (error) { toast.error(error); }
    else {
      toast.success('Recebimento registrado!');
      setShowReceiveModal(false);
      setReceiveForm({ receivedValue: 0, receivedDate: '' });
      setSelectedReceivable(null);
      refetch();
    }
  };

  const handleAddReimbursement = async () => {
    if (!reimbursementForm.category || reimbursementForm.requestedValue <= 0) {
      toast.error('Preencha categoria e valor');
      return;
    }
    setModalLoading(true);
    const { error } = await apiPost('/api/reimbursements', {
      ...reimbursementForm,
      campaignId: id,
    });
    setModalLoading(false);
    if (error) { toast.error(error); }
    else {
      toast.success('Reembolso solicitado!');
      setShowReimbursementModal(false);
      setReimbursementForm({ category: '', requestedValue: 0, description: '' });
      refetch();
    }
  };

  const handleGenerateCommissions = async () => {
    setModalLoading(true);
    const { error } = await apiPost(`/api/campaigns/${id}/commissions`, {});
    setModalLoading(false);
    if (error) { toast.error(error); }
    else { toast.success('Comissoes geradas!'); refetch(); }
  };

  const handleCommissionAction = async (commissionId: string, action: string) => {
    const status = action === 'approve' ? 'APROVADA' : 'PAGA';
    const { error } = await apiPatch(`/api/campaigns/${id}/commissions/${commissionId}`, { status });
    if (error) { toast.error(error); }
    else { toast.success(`Comissao ${action === 'approve' ? 'aprovada' : 'paga'}!`); refetch(); }
  };

  // --- Column definitions ---

  const influencerCols: Column<InfluencerDetail>[] = [
    { key: 'name', header: 'Nome', sortable: true, render: (i) => (
      <div>
        <p className="font-medium text-slate-900">{i.name}</p>
        {i.socialHandle && <p className="text-xs text-slate-500">{i.socialHandle}</p>}
      </div>
    )},
    { key: 'negotiatedValue', header: 'Negociado', sortable: true, render: (i) => formatCurrency(i.negotiatedValue) },
    { key: 'paidValue', header: 'Pago', render: (i) => formatCurrency(i.paidValue) },
    { key: 'openValue', header: 'Pendente', render: (i) => (
      <span className={i.openValue > 0 ? 'text-warning-600 font-medium' : 'text-success-600'}>
        {formatCurrency(i.openValue)}
      </span>
    )},
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'actions', header: 'Acoes', render: (i) => (
      <Button
        variant="ghost"
        size="sm"
        disabled={i.openValue <= 0}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedInfluencer(i);
          setPaymentForm({ value: 0, paymentDate: '', paymentMethod: '', notes: '' });
          setShowPaymentModal(true);
        }}
      >
        <CreditCard className="h-3.5 w-3.5" /> Pagar
      </Button>
    )},
  ];

  const receivableCols: Column<ReceivableDetail>[] = [
    { key: 'invoiceNumber', header: 'NF', render: (i) => i.invoiceNumber || '-' },
    { key: 'value', header: 'Valor', sortable: true, render: (i) => formatCurrency(i.value) },
    { key: 'dueDate', header: 'Vencimento', sortable: true, render: (i) => formatDate(i.dueDate) },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'receivedValue', header: 'Recebido', render: (i) => i.receivedValue != null ? formatCurrency(i.receivedValue) : '-' },
    { key: 'actions', header: 'Acoes', render: (i) => (
      i.status !== 'RECEBIDO' ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedReceivable(i);
            setReceiveForm({ receivedValue: 0, receivedDate: '' });
            setShowReceiveModal(true);
          }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Receber
        </Button>
      ) : null
    )},
  ];

  const reimbursementCols: Column<ReimbursementDetail>[] = [
    { key: 'category', header: 'Categoria' },
    { key: 'employee', header: 'Funcionario', render: (i) => i.employee.name },
    { key: 'requestedValue', header: 'Solicitado', render: (i) => formatCurrency(i.requestedValue) },
    { key: 'approvedValue', header: 'Aprovado', render: (i) => i.approvedValue != null ? formatCurrency(i.approvedValue) : '-' },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
  ];

  const commissionCols: Column<CommissionDetail>[] = [
    { key: 'employee', header: 'Funcionario', render: (i) => i.employee.name },
    { key: 'role', header: 'Funcao', render: (i) => <Badge variant="info">{i.role}</Badge> },
    { key: 'basis', header: 'Base' },
    { key: 'percentage', header: '%', render: (i) => `${i.percentage}%` },
    { key: 'calculatedValue', header: 'Valor', render: (i) => formatCurrency(i.calculatedValue) },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'actions', header: 'Acoes', render: (i) => (
      <div className="flex gap-1">
        {i.status === 'CALCULADA' && (
          <Button variant="ghost" size="sm" onClick={() => handleCommissionAction(i.id, 'approve')}>
            Aprovar
          </Button>
        )}
        {i.status === 'APROVADA' && (
          <Button variant="ghost" size="sm" onClick={() => handleCommissionAction(i.id, 'pay')}>
            Pagar
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/campanhas')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{campaign.name}</h2>
              <Badge>{campaign.status}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span>{campaign.client?.name}</span>
              {campaign.executive && (
                <>
                  <span className="text-slate-300">|</span>
                  <span>Exec: {campaign.executive.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Valor Vendido" value={formatCurrency(campaign.soldValue)} color="blue" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Influenciadores" value={formatCurrency(t.totalInfluencers)} color="orange" />
        <StatCard icon={<Receipt className="h-5 w-5" />} label="Total Reembolsos" value={formatCurrency(t.totalReimbursements)} color="amber" />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Margem"
          value={`${formatCurrency(t.margin)} (${t.marginPercent.toFixed(1)}%)`}
          color={t.margin >= 0 ? 'green' : 'red'}
        />
        <StatCard icon={<Percent className="h-5 w-5" />} label="Comissao Executivo" value={formatCurrency(t.totalCommissions)} color="purple" />
        <StatCard icon={<Percent className="h-5 w-5" />} label="Comissoes Total" value={formatCurrency(t.totalCommissions)} color="teal" />
        <StatCard icon={<ArrowDownCircle className="h-5 w-5" />} label="A Receber" value={formatCurrency(t.totalReceivables)} color="amber" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Recebido" value={formatCurrency(t.totalReceived)} color="emerald" />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Informacoes Gerais">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Cliente</span>
                <span className="text-sm font-medium text-slate-900">{campaign.client?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Executivo</span>
                <span className="text-sm font-medium text-slate-900">{campaign.executive?.name || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Operacao</span>
                <span className="text-sm font-medium text-slate-900">{campaign.operation?.name || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Centro de Custo</span>
                <span className="text-sm font-medium text-slate-900">{campaign.costCenter?.name || '-'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-slate-500">Status</span>
                <Badge>{campaign.status}</Badge>
              </div>
            </div>
          </Card>
          <Card title="Resumo Financeiro">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">Valor Vendido</span>
                <span className="text-sm font-bold text-primary-600">{formatCurrency(campaign.soldValue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">(-) Influenciadores</span>
                <span className="text-sm font-medium text-slate-900">{formatCurrency(t.totalInfluencers)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">(-) Reembolsos</span>
                <span className="text-sm font-medium text-slate-900">{formatCurrency(t.totalReimbursements)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">(-) Comissoes</span>
                <span className="text-sm font-medium text-slate-900">{formatCurrency(t.totalCommissions)}</span>
              </div>
              <div className="flex justify-between py-2 bg-slate-50 -mx-6 px-6 rounded-lg">
                <span className="text-sm font-bold text-slate-900">= Margem</span>
                <span className={`text-sm font-bold ${t.margin >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(t.margin)} ({t.marginPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'influenciadores' && (
        <Card
          title="Influenciadores"
          action={
            <Button size="sm" onClick={() => { setInfluencerForm({ name: '', socialHandle: '', negotiatedValue: 0 }); setShowInfluencerModal(true); }}>
              <Plus className="h-4 w-4" /> Adicionar Influenciador
            </Button>
          }
          noPadding
        >
          <DataTable
            columns={influencerCols}
            data={campaign.influencers || []}
            keyExtractor={(i) => i.id}
            emptyMessage="Nenhum influenciador adicionado"
            emptyDescription="Adicione influenciadores a esta campanha."
          />
        </Card>
      )}

      {activeTab === 'recebimentos' && (
        <Card
          title="Recebimentos"
          action={
            <Button size="sm" onClick={() => { setReceivableForm({ invoiceNumber: '', value: 0, dueDate: '' }); setShowReceivableModal(true); }}>
              <Plus className="h-4 w-4" /> Nova Nota Fiscal
            </Button>
          }
          noPadding
        >
          <DataTable
            columns={receivableCols}
            data={campaign.receivables || []}
            keyExtractor={(i) => i.id}
            emptyMessage="Nenhum recebimento cadastrado"
            emptyDescription="Adicione notas fiscais para controlar os recebimentos."
          />
        </Card>
      )}

      {activeTab === 'reembolsos' && (
        <Card
          title="Reembolsos"
          action={
            <Button size="sm" onClick={() => { setReimbursementForm({ category: '', requestedValue: 0, description: '' }); setShowReimbursementModal(true); }}>
              <Plus className="h-4 w-4" /> Novo Reembolso
            </Button>
          }
          noPadding
        >
          <DataTable
            columns={reimbursementCols}
            data={campaign.reimbursements || []}
            keyExtractor={(i) => i.id}
            emptyMessage="Nenhum reembolso vinculado"
          />
        </Card>
      )}

      {activeTab === 'comissoes' && (
        <Card
          title="Comissoes"
          action={
            <Button size="sm" onClick={handleGenerateCommissions} loading={modalLoading}>
              Gerar Comissoes
            </Button>
          }
          noPadding
        >
          <DataTable
            columns={commissionCols}
            data={campaign.commissions || []}
            keyExtractor={(i) => i.id}
            emptyMessage="Nenhuma comissao gerada"
            emptyDescription="Clique em 'Gerar Comissoes' para calcular automaticamente."
          />
        </Card>
      )}

      {activeTab === 'historico' && (
        <Card title="Historico de Atividades">
          <EmptyState
            icon={<Clock className="h-8 w-8 text-slate-400" />}
            title="Historico de auditoria"
            description="O historico de alteracoes desta campanha sera exibido aqui."
          />
        </Card>
      )}

      {/* --- Modals --- */}

      {/* Add Influencer Modal */}
      <Modal
        open={showInfluencerModal}
        onClose={() => setShowInfluencerModal(false)}
        title="Adicionar Influenciador"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowInfluencerModal(false)}>Cancelar</Button>
            <Button onClick={handleAddInfluencer} loading={modalLoading}>Adicionar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome do Influenciador *"
            value={influencerForm.name}
            onChange={(e) => setInfluencerForm({ ...influencerForm, name: e.target.value })}
            placeholder="Nome completo"
          />
          <Input
            label="Handle / Rede Social"
            value={influencerForm.socialHandle}
            onChange={(e) => setInfluencerForm({ ...influencerForm, socialHandle: e.target.value })}
            placeholder="@usuario"
          />
          <CurrencyInput
            label="Valor Negociado *"
            value={influencerForm.negotiatedValue}
            onChange={(v) => setInfluencerForm({ ...influencerForm, negotiatedValue: v })}
          />
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Registrar Pagamento - ${selectedInfluencer?.name || ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>Cancelar</Button>
            <Button onClick={handleAddPayment} loading={modalLoading}>Registrar</Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedInfluencer && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="text-slate-500">Valor pendente: <span className="font-medium text-slate-900">{formatCurrency(selectedInfluencer.openValue)}</span></p>
            </div>
          )}
          <CurrencyInput
            label="Valor do Pagamento *"
            value={paymentForm.value}
            onChange={(v) => setPaymentForm({ ...paymentForm, value: v })}
          />
          <Input
            label="Data do Pagamento *"
            type="date"
            value={paymentForm.paymentDate}
            onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
          />
          <Select
            label="Forma de Pagamento"
            options={[
              { value: 'PIX', label: 'PIX' },
              { value: 'TRANSFERENCIA', label: 'Transferencia' },
              { value: 'BOLETO', label: 'Boleto' },
            ]}
            value={paymentForm.paymentMethod}
            onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
            placeholder="Selecione"
          />
          <Textarea
            label="Observacoes"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            rows={2}
          />
        </div>
      </Modal>

      {/* Receivable Modal */}
      <Modal
        open={showReceivableModal}
        onClose={() => setShowReceivableModal(false)}
        title="Nova Nota Fiscal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReceivableModal(false)}>Cancelar</Button>
            <Button onClick={handleAddReceivable} loading={modalLoading}>Adicionar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Numero da NF"
            value={receivableForm.invoiceNumber}
            onChange={(e) => setReceivableForm({ ...receivableForm, invoiceNumber: e.target.value })}
            placeholder="Ex: NF-001234"
          />
          <CurrencyInput
            label="Valor *"
            value={receivableForm.value}
            onChange={(v) => setReceivableForm({ ...receivableForm, value: v })}
          />
          <Input
            label="Data de Vencimento *"
            type="date"
            value={receivableForm.dueDate}
            onChange={(e) => setReceivableForm({ ...receivableForm, dueDate: e.target.value })}
          />
        </div>
      </Modal>

      {/* Receive Modal */}
      <Modal
        open={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title="Registrar Recebimento"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReceiveModal(false)}>Cancelar</Button>
            <Button onClick={handleReceive} loading={modalLoading}>Registrar</Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedReceivable && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="text-slate-500">NF: <span className="font-medium text-slate-900">{selectedReceivable.invoiceNumber || '-'}</span></p>
              <p className="text-slate-500">Valor: <span className="font-medium text-slate-900">{formatCurrency(selectedReceivable.value)}</span></p>
            </div>
          )}
          <CurrencyInput
            label="Valor Recebido *"
            value={receiveForm.receivedValue}
            onChange={(v) => setReceiveForm({ ...receiveForm, receivedValue: v })}
          />
          <Input
            label="Data do Recebimento *"
            type="date"
            value={receiveForm.receivedDate}
            onChange={(e) => setReceiveForm({ ...receiveForm, receivedDate: e.target.value })}
          />
        </div>
      </Modal>

      {/* Reimbursement Modal */}
      <Modal
        open={showReimbursementModal}
        onClose={() => setShowReimbursementModal(false)}
        title="Novo Reembolso"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReimbursementModal(false)}>Cancelar</Button>
            <Button onClick={handleAddReimbursement} loading={modalLoading}>Solicitar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Categoria *"
            options={[
              { value: 'ALIMENTACAO', label: 'Alimentacao' },
              { value: 'TRANSPORTE', label: 'Transporte' },
              { value: 'HOSPEDAGEM', label: 'Hospedagem' },
              { value: 'MATERIAL', label: 'Material' },
              { value: 'OUTROS', label: 'Outros' },
            ]}
            value={reimbursementForm.category}
            onChange={(e) => setReimbursementForm({ ...reimbursementForm, category: e.target.value })}
            placeholder="Selecione a categoria"
          />
          <CurrencyInput
            label="Valor Solicitado *"
            value={reimbursementForm.requestedValue}
            onChange={(v) => setReimbursementForm({ ...reimbursementForm, requestedValue: v })}
          />
          <Textarea
            label="Descricao"
            value={reimbursementForm.description}
            onChange={(e) => setReimbursementForm({ ...reimbursementForm, description: e.target.value })}
            placeholder="Descreva o motivo do reembolso..."
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
