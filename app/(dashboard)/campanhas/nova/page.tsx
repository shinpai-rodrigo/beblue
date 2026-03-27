'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch, apiPost } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const clientTypeOptions = [
  { value: 'DIRETO', label: 'Direto' },
  { value: 'AGENCIA', label: 'Agencia' },
];

export default function NovaCampanhaPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    description: '',
    clientId: '',
    clientType: '',
    executiveId: '',
    operationId: '',
    costCenterId: '',
    startDate: '',
    endDate: '',
    soldValue: 0,
    notes: '',
  });

  const { data: clientsData } = useFetch<any>('/api/clients?limit=200');
  const { data: employeesData } = useFetch<any>('/api/employees?limit=200');
  const { data: costCentersData } = useFetch<any>('/api/cost-centers?limit=200');

  const clients = (clientsData?.data || []).map((c: any) => ({ value: c.id, label: c.name }));
  const employees = (employeesData?.data || []).map((e: any) => ({ value: e.id, label: e.name }));
  const costCenters = (costCentersData?.data || []).map((cc: any) => ({ value: cc.id, label: cc.name }));

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome e obrigatorio';
    if (!form.clientId) errs.clientId = 'Cliente e obrigatorio';
    if (form.soldValue <= 0) errs.soldValue = 'Valor vendido deve ser maior que zero';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const payload = {
      ...form,
      soldValue: form.soldValue,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      executiveId: form.executiveId || undefined,
      operationId: form.operationId || undefined,
      costCenterId: form.costCenterId || undefined,
    };
    const { data, error } = await apiPost('/api/campaigns', payload);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Campanha criada com sucesso!');
      router.push(`/campanhas/${data?.id || ''}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Nova Campanha</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome da Campanha *"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="Nome da campanha"
            />
            <Select
              label="Cliente *"
              options={clients}
              value={form.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
              error={errors.clientId}
              placeholder="Selecione o cliente"
            />
          </div>

          <Textarea
            label="Descricao"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descricao da campanha..."
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo do Cliente"
              options={clientTypeOptions}
              value={form.clientType}
              onChange={(e) => handleChange('clientType', e.target.value)}
              placeholder="Selecione o tipo"
            />
            <CurrencyInput
              label="Valor Vendido *"
              value={form.soldValue}
              onChange={(v) => handleChange('soldValue', v)}
              error={errors.soldValue}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Executivo"
              options={employees}
              value={form.executiveId}
              onChange={(e) => handleChange('executiveId', e.target.value)}
              placeholder="Selecione o executivo"
            />
            <Select
              label="Operacao"
              options={employees}
              value={form.operationId}
              onChange={(e) => handleChange('operationId', e.target.value)}
              placeholder="Selecione o responsavel"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Centro de Custo"
              options={costCenters}
              value={form.costCenterId}
              onChange={(e) => handleChange('costCenterId', e.target.value)}
              placeholder="Selecione o centro de custo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data Inicio"
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
            <Input
              label="Data Fim"
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
            />
          </div>

          <Textarea
            label="Observacoes"
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Observacoes adicionais..."
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Criar Campanha
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
