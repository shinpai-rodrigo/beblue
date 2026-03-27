'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFetch, apiPost } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const categoryOptions = [
  { value: 'ALIMENTACAO', label: 'Alimentacao' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'HOSPEDAGEM', label: 'Hospedagem' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'OUTROS', label: 'Outros' },
];

const categoryLimits: Record<string, string> = {
  ALIMENTACAO: 'Limite: R$ 50,00/dia',
  TRANSPORTE: 'Limite: R$ 100,00/dia',
  HOSPEDAGEM: 'Limite: R$ 300,00/dia',
  MATERIAL: 'Limite: R$ 200,00/solicitacao',
  OUTROS: 'Sujeito a aprovacao',
};

export default function NovoReembolsoPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    employeeId: '',
    campaignId: '',
    costCenterId: '',
    category: '',
    requestedValue: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const { data: employeesData } = useFetch<any>('/api/employees?limit=200');
  const { data: campaignsData } = useFetch<any>('/api/campaigns?limit=200');
  const { data: costCentersData } = useFetch<any>('/api/cost-centers?limit=200');
  const { data: rulesData } = useFetch<any>('/api/reimbursement-rules');

  const employees = (employeesData?.data || []).map((e: any) => ({ value: e.id, label: e.name }));
  const campaigns = (campaignsData?.data || []).map((c: any) => ({ value: c.id, label: c.name }));
  const costCenters = (costCentersData?.data || []).map((cc: any) => ({ value: cc.id, label: cc.name }));

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.employeeId) errs.employeeId = 'Funcionario e obrigatorio';
    if (!form.category) errs.category = 'Categoria e obrigatoria';
    if (form.requestedValue <= 0) errs.requestedValue = 'Valor deve ser maior que zero';
    if (!form.date) errs.date = 'Data e obrigatoria';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const payload = {
      ...form,
      campaignId: form.campaignId || undefined,
      costCenterId: form.costCenterId || undefined,
    };
    const { error } = await apiPost('/api/reimbursements', payload);
    setLoading(false);

    if (error) { toast.error(error); }
    else { toast.success('Reembolso solicitado com sucesso!'); router.push('/reembolsos'); }
  };

  // Find applicable rule
  const ruleHint = form.category ? categoryLimits[form.category] || '' : '';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Novo Reembolso</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Funcionario *"
              options={employees}
              value={form.employeeId}
              onChange={(e) => handleChange('employeeId', e.target.value)}
              error={errors.employeeId}
              placeholder="Selecione o funcionario"
            />
            <Select
              label="Campanha (opcional)"
              options={campaigns}
              value={form.campaignId}
              onChange={(e) => handleChange('campaignId', e.target.value)}
              placeholder="Selecione a campanha"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Centro de Custo"
              options={costCenters}
              value={form.costCenterId}
              onChange={(e) => handleChange('costCenterId', e.target.value)}
              placeholder="Selecione"
            />
            <Select
              label="Categoria *"
              options={categoryOptions}
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              error={errors.category}
              placeholder="Selecione a categoria"
              hint={ruleHint}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CurrencyInput
              label="Valor Solicitado *"
              value={form.requestedValue}
              onChange={(v) => handleChange('requestedValue', v)}
              error={errors.requestedValue}
            />
            <Input
              label="Data *"
              type="date"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              error={errors.date}
            />
          </div>

          <Textarea
            label="Descricao / Justificativa"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descreva o motivo do reembolso..."
            rows={3}
          />

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-1">Comprovante</p>
            <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded-lg bg-white">
              <p className="text-sm text-slate-500">Arraste o comprovante aqui ou clique para selecionar</p>
            </div>
            <p className="text-xs text-slate-400 mt-1">PDF, JPG ou PNG. Max 5MB.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={loading}>Solicitar Reembolso</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
