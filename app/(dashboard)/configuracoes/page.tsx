'use client';

import { useState, useCallback } from 'react';
import { useFetch, apiPost, apiPatch, apiDelete } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Tabs } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface ReimbursementRule {
  id: string;
  category: string;
  dailyLimit: number;
  status: string;
}

interface CommissionRule {
  id: string;
  role: string;
  clientType: string;
  basis: string;
  percentage: number;
  validFrom: string | null;
  validTo: string | null;
  status: string;
}

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

const categoryOptions = [
  { value: 'ALIMENTACAO', label: 'Alimentacao' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'HOSPEDAGEM', label: 'Hospedagem' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'OUTROS', label: 'Outros' },
];

const roleOptions = [
  { value: 'EXECUTIVO', label: 'Executivo' },
  { value: 'OPERACAO', label: 'Operacao' },
];

const clientTypeOptions = [
  { value: 'DIRETO', label: 'Direto' },
  { value: 'AGENCIA', label: 'Agencia' },
  { value: 'TODOS', label: 'Todos' },
];

const userRoleOptions = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'OPERACAO', label: 'Operacao' },
  { value: 'VISUALIZADOR', label: 'Visualizador' },
];

export default function ConfiguracoesPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('reembolso');

  // Reimbursement rules
  const { data: reimbursementData, loading: reimbLoading, refetch: refetchReimb } = useFetch<any>('/api/reimbursement-rules');
  const [showReimbModal, setShowReimbModal] = useState(false);
  const [reimbForm, setReimbForm] = useState({ category: '', dailyLimit: 0 });
  const [reimbLoading2, setReimbLoading2] = useState(false);

  // Commission rules
  const { data: commissionData, loading: commLoading, refetch: refetchComm } = useFetch<any>('/api/commission-rules');
  const [showCommModal, setShowCommModal] = useState(false);
  const [commForm, setCommForm] = useState({ role: '', clientType: '', basis: 'VALOR_VENDIDO', percentage: 0 });
  const [commLoading2, setCommLoading2] = useState(false);

  // Users
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useFetch<any>('/api/users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ email: '', name: '', role: '', password: '' });
  const [userLoading2, setUserLoading2] = useState(false);

  const reimbRules: ReimbursementRule[] = reimbursementData?.data || reimbursementData || [];
  const commRules: CommissionRule[] = commissionData?.data || commissionData || [];
  const users: UserItem[] = usersData?.data || usersData || [];

  const tabs = [
    { key: 'reembolso', label: 'Regras de Reembolso' },
    { key: 'comissao', label: 'Regras de Comissao' },
    { key: 'usuarios', label: 'Usuarios' },
  ];

  // Handlers
  const handleCreateReimbRule = async () => {
    if (!reimbForm.category || reimbForm.dailyLimit <= 0) { toast.error('Preencha todos os campos'); return; }
    setReimbLoading2(true);
    const { error } = await apiPost('/api/reimbursement-rules', reimbForm);
    setReimbLoading2(false);
    if (error) { toast.error(error); } else { toast.success('Regra criada!'); setShowReimbModal(false); refetchReimb(); }
  };

  const handleCreateCommRule = async () => {
    if (!commForm.role || commForm.percentage <= 0) { toast.error('Preencha todos os campos'); return; }
    setCommLoading2(true);
    const { error } = await apiPost('/api/commission-rules', commForm);
    setCommLoading2(false);
    if (error) { toast.error(error); } else { toast.success('Regra criada!'); setShowCommModal(false); refetchComm(); }
  };

  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.name || !userForm.role) { toast.error('Preencha todos os campos obrigatorios'); return; }
    setUserLoading2(true);
    const { error } = await apiPost('/api/users', userForm);
    setUserLoading2(false);
    if (error) { toast.error(error); } else { toast.success('Usuario criado!'); setShowUserModal(false); refetchUsers(); }
  };

  // Table columns
  const reimbCols: Column<ReimbursementRule>[] = [
    { key: 'category', header: 'Categoria', render: (i) => <span className="font-medium">{i.category.replace(/_/g, ' ')}</span> },
    { key: 'dailyLimit', header: 'Limite Diario', render: (i) => formatCurrency(i.dailyLimit) },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
  ];

  const commCols: Column<CommissionRule>[] = [
    { key: 'role', header: 'Cargo', render: (i) => <span className="font-medium">{i.role}</span> },
    { key: 'clientType', header: 'Tipo Cliente', render: (i) => i.clientType || 'Todos' },
    { key: 'basis', header: 'Base', render: (i) => i.basis.replace(/_/g, ' ') },
    { key: 'percentage', header: 'Percentual', render: (i) => `${i.percentage}%` },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
  ];

  const userCols: Column<UserItem>[] = [
    { key: 'name', header: 'Nome', sortable: true, render: (i) => <span className="font-medium text-slate-900">{i.name}</span> },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Funcao', render: (i) => <Badge variant="info">{i.role}</Badge> },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Configuracoes</h2>

      <Card noPadding>
        <div className="px-6 pt-4">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {activeTab === 'reembolso' && (
          <div>
            <div className="p-4 flex justify-end border-b border-slate-200">
              <Button size="sm" onClick={() => { setReimbForm({ category: '', dailyLimit: 0 }); setShowReimbModal(true); }}>
                <Plus className="h-4 w-4" /> Nova Regra
              </Button>
            </div>
            <DataTable columns={reimbCols} data={reimbRules} loading={reimbLoading} keyExtractor={(i) => i.id} emptyMessage="Nenhuma regra de reembolso" />
          </div>
        )}

        {activeTab === 'comissao' && (
          <div>
            <div className="p-4 flex justify-end border-b border-slate-200">
              <Button size="sm" onClick={() => { setCommForm({ role: '', clientType: '', basis: 'VALOR_VENDIDO', percentage: 0 }); setShowCommModal(true); }}>
                <Plus className="h-4 w-4" /> Nova Regra
              </Button>
            </div>
            <DataTable columns={commCols} data={commRules} loading={commLoading} keyExtractor={(i) => i.id} emptyMessage="Nenhuma regra de comissao" />
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div>
            <div className="p-4 flex justify-end border-b border-slate-200">
              <Button size="sm" onClick={() => { setUserForm({ email: '', name: '', role: '', password: '' }); setShowUserModal(true); }}>
                <Plus className="h-4 w-4" /> Novo Usuario
              </Button>
            </div>
            <DataTable columns={userCols} data={users} loading={usersLoading} keyExtractor={(i) => i.id} emptyMessage="Nenhum usuario cadastrado" />
          </div>
        )}
      </Card>

      {/* Reimbursement Rule Modal */}
      <Modal open={showReimbModal} onClose={() => setShowReimbModal(false)} title="Nova Regra de Reembolso"
        footer={<><Button variant="ghost" onClick={() => setShowReimbModal(false)}>Cancelar</Button><Button onClick={handleCreateReimbRule} loading={reimbLoading2}>Criar</Button></>}>
        <div className="space-y-4">
          <Select label="Categoria *" options={categoryOptions} value={reimbForm.category} onChange={(e) => setReimbForm({ ...reimbForm, category: e.target.value })} placeholder="Selecione" />
          <CurrencyInput label="Limite Diario *" value={reimbForm.dailyLimit} onChange={(v) => setReimbForm({ ...reimbForm, dailyLimit: v })} />
        </div>
      </Modal>

      {/* Commission Rule Modal */}
      <Modal open={showCommModal} onClose={() => setShowCommModal(false)} title="Nova Regra de Comissao"
        footer={<><Button variant="ghost" onClick={() => setShowCommModal(false)}>Cancelar</Button><Button onClick={handleCreateCommRule} loading={commLoading2}>Criar</Button></>}>
        <div className="space-y-4">
          <Select label="Cargo *" options={roleOptions} value={commForm.role} onChange={(e) => setCommForm({ ...commForm, role: e.target.value })} placeholder="Selecione" />
          <Select label="Tipo de Cliente" options={clientTypeOptions} value={commForm.clientType} onChange={(e) => setCommForm({ ...commForm, clientType: e.target.value })} placeholder="Selecione" />
          <Select label="Base de Calculo" options={[{ value: 'VALOR_VENDIDO', label: 'Valor Vendido' }, { value: 'MARGEM', label: 'Margem' }]} value={commForm.basis} onChange={(e) => setCommForm({ ...commForm, basis: e.target.value })} />
          <Input label="Percentual (%)*" type="number" step="0.1" value={String(commForm.percentage)} onChange={(e) => setCommForm({ ...commForm, percentage: parseFloat(e.target.value) || 0 })} placeholder="Ex: 5.0" />
        </div>
      </Modal>

      {/* User Modal */}
      <Modal open={showUserModal} onClose={() => setShowUserModal(false)} title="Novo Usuario"
        footer={<><Button variant="ghost" onClick={() => setShowUserModal(false)}>Cancelar</Button><Button onClick={handleCreateUser} loading={userLoading2}>Criar</Button></>}>
        <div className="space-y-4">
          <Input label="Nome *" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="Nome completo" />
          <Input label="Email *" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="email@exemplo.com" />
          <Select label="Funcao *" options={userRoleOptions} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} placeholder="Selecione" />
          <Input label="Senha (temporaria)" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="Deixe vazio para gerar automaticamente" />
        </div>
      </Modal>
    </div>
  );
}
