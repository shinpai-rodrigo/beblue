'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFetch, apiPut } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { PageLoading } from '@/components/ui/loading';
import { ArrowLeft } from 'lucide-react';

interface EmployeeDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  department: string | null;
  role: string;
  status: string;
  commissions: Array<{
    id: string;
    campaignName: string;
    calculatedValue: number;
    status: string;
    createdAt: string;
  }>;
  reimbursements: Array<{
    id: string;
    category: string;
    requestedValue: number;
    approvedValue: number | null;
    status: string;
    createdAt: string;
  }>;
}

const roleOptions = [
  { value: 'EXECUTIVO', label: 'Executivo' },
  { value: 'OPERACAO', label: 'Operacao' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'VISUALIZADOR', label: 'Visualizador' },
];

export default function FuncionarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.id as string;

  const { data: employee, loading, error, refetch } = useFetch<EmployeeDetail>(`/api/employees/${id}`);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', position: '', department: '', role: '', status: '',
  });

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        role: employee.role || '',
        status: employee.status || '',
      });
    }
  }, [employee]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await apiPut(`/api/employees/${id}`, form);
    setSaving(false);
    if (error) { toast.error(error); }
    else { toast.success('Funcionario atualizado!'); setEditing(false); refetch(); }
  };

  if (loading) return <PageLoading />;
  if (error) return <div className="p-6 text-center text-danger-600">Erro: {error}</div>;
  if (!employee) return <div className="p-6 text-center text-slate-500">Funcionario nao encontrado</div>;

  const commissionCols: Column<EmployeeDetail['commissions'][0]>[] = [
    { key: 'campaignName', header: 'Campanha', sortable: true },
    { key: 'calculatedValue', header: 'Valor', render: (i) => formatCurrency(i.calculatedValue) },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'createdAt', header: 'Data', render: (i) => formatDate(i.createdAt) },
  ];

  const reimbursementCols: Column<EmployeeDetail['reimbursements'][0]>[] = [
    { key: 'category', header: 'Categoria' },
    { key: 'requestedValue', header: 'Solicitado', render: (i) => formatCurrency(i.requestedValue) },
    { key: 'approvedValue', header: 'Aprovado', render: (i) => i.approvedValue != null ? formatCurrency(i.approvedValue) : '-' },
    { key: 'status', header: 'Status', render: (i) => <Badge>{i.status}</Badge> },
    { key: 'createdAt', header: 'Data', render: (i) => formatDate(i.createdAt) },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/funcionarios')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">{employee.name}</h2>
              <Badge>{employee.status}</Badge>
              <Badge variant="info">{employee.role}</Badge>
            </div>
            <p className="text-sm text-slate-500">{employee.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button onClick={handleSave} loading={saving}>Salvar</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>Editar</Button>
          )}
        </div>
      </div>

      <Card title="Dados do Funcionario">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Cargo" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Departamento" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              <Select label="Funcao" options={roleOptions} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <Select
              label="Status"
              options={[{ value: 'ATIVO', label: 'Ativo' }, { value: 'INATIVO', label: 'Inativo' }]}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div><p className="text-xs font-medium text-slate-500 uppercase">Telefone</p><p className="text-sm text-slate-900 mt-0.5">{employee.phone || '-'}</p></div>
            <div><p className="text-xs font-medium text-slate-500 uppercase">Cargo</p><p className="text-sm text-slate-900 mt-0.5">{employee.position || '-'}</p></div>
            <div><p className="text-xs font-medium text-slate-500 uppercase">Departamento</p><p className="text-sm text-slate-900 mt-0.5">{employee.department || '-'}</p></div>
            <div><p className="text-xs font-medium text-slate-500 uppercase">Funcao</p><p className="text-sm text-slate-900 mt-0.5">{employee.role}</p></div>
          </div>
        )}
      </Card>

      <Card title="Historico de Comissoes" noPadding>
        <DataTable
          columns={commissionCols}
          data={employee.commissions || []}
          keyExtractor={(i) => i.id}
          emptyMessage="Nenhuma comissao registrada"
        />
      </Card>

      <Card title="Historico de Reembolsos" noPadding>
        <DataTable
          columns={reimbursementCols}
          data={employee.reimbursements || []}
          keyExtractor={(i) => i.id}
          emptyMessage="Nenhum reembolso registrado"
        />
      </Card>
    </div>
  );
}
