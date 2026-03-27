'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFetch, apiPut } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { PageLoading } from '@/components/ui/loading';
import { ArrowLeft, Megaphone, DollarSign, TrendingUp } from 'lucide-react';

const states = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
].map((s) => ({ value: s, label: s }));

interface ClientDetail {
  id: string;
  name: string;
  tradeName: string | null;
  document: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  status: string;
  notes: string | null;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    soldValue: number;
  }>;
  financialSummary?: {
    totalSold: number;
    totalReceived: number;
    totalMargin: number;
  };
}

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.id as string;

  const { data: client, loading, error, refetch } = useFetch<ClientDetail>(`/api/clients/${id}`);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tradeName: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    notes: '',
    status: '',
  });

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || '',
        tradeName: client.tradeName || '',
        document: client.document || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        notes: client.notes || '',
        status: client.status || '',
      });
    }
  }, [client]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await apiPut(`/api/clients/${id}`, form);
    setSaving(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Cliente atualizado com sucesso!');
      setEditing(false);
      refetch();
    }
  };

  if (loading) return <PageLoading />;
  if (error) return <div className="p-6 text-center text-danger-600">Erro: {error}</div>;
  if (!client) return <div className="p-6 text-center text-slate-500">Cliente nao encontrado</div>;

  const summary = client.financialSummary || { totalSold: 0, totalReceived: 0, totalMargin: 0 };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/clientes')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">{client.name}</h2>
              <Badge>{client.status}</Badge>
            </div>
            {client.tradeName && (
              <p className="text-sm text-slate-500">{client.tradeName}</p>
            )}
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

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Vendido"
          value={formatCurrency(summary.totalSold)}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Recebido"
          value={formatCurrency(summary.totalReceived)}
          color="green"
        />
        <StatCard
          icon={<Megaphone className="h-5 w-5" />}
          label="Campanhas"
          value={String(client.campaigns?.length || 0)}
          color="purple"
        />
      </div>

      {/* Client Info */}
      <Card title="Dados do Cliente">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Nome Fantasia" value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Documento" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
              <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Endereco" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Select label="Estado" options={states} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="Selecione" />
            </div>
            <Select
              label="Status"
              options={[
                { value: 'ATIVO', label: 'Ativo' },
                { value: 'INATIVO', label: 'Inativo' },
              ]}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            />
            <Textarea label="Observacoes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Documento</p>
              <p className="text-sm text-slate-900 mt-0.5">{client.document}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
              <p className="text-sm text-slate-900 mt-0.5">{client.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Telefone</p>
              <p className="text-sm text-slate-900 mt-0.5">{client.phone || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Endereco</p>
              <p className="text-sm text-slate-900 mt-0.5">{client.address || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Cidade</p>
              <p className="text-sm text-slate-900 mt-0.5">{client.city || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Estado</p>
              <p className="text-sm text-slate-900 mt-0.5">{client.state || '-'}</p>
            </div>
            {client.notes && (
              <div className="md:col-span-2">
                <p className="text-xs font-medium text-slate-500 uppercase">Observacoes</p>
                <p className="text-sm text-slate-900 mt-0.5">{client.notes}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Campaigns */}
      <Card title="Campanhas" noPadding>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Valor Vendido</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(!client.campaigns || client.campaigns.length === 0) ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">
                    Nenhuma campanha vinculada
                  </td>
                </tr>
              ) : (
                client.campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/campanhas/${c.id}`)}
                  >
                    <td className="px-6 py-3 text-sm font-medium text-slate-900">{c.name}</td>
                    <td className="px-6 py-3 text-sm text-right text-slate-700">{formatCurrency(c.soldValue)}</td>
                    <td className="px-6 py-3"><Badge>{c.status}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
