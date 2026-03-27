'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function NovoFechamentoPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    weekStart: '',
    openingBalance: 0,
    actualBalance: 0,
    justification: '',
  });

  // Calculate the week end (6 days after start)
  const weekEnd = form.weekStart
    ? new Date(new Date(form.weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : '';

  // These would come from the API in practice
  const estimatedIncome = 0;
  const estimatedExpenses = 0;
  const expectedBalance = form.openingBalance + estimatedIncome - estimatedExpenses;
  const difference = form.actualBalance - expectedBalance;

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.weekStart) errs.weekStart = 'Data de inicio e obrigatoria';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { data, error } = await apiPost('/api/weekly-closings', {
      weekStart: form.weekStart,
      weekEnd,
      openingBalance: form.openingBalance,
      actualBalance: form.actualBalance,
      justification: form.justification || undefined,
    });
    setLoading(false);

    if (error) { toast.error(error); }
    else { toast.success('Fechamento criado!'); router.push(`/fechamento/${data?.id || ''}`); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Novo Fechamento Semanal</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Inicio da Semana *"
              type="date"
              value={form.weekStart}
              onChange={(e) => handleChange('weekStart', e.target.value)}
              error={errors.weekStart}
            />
            <Input
              label="Fim da Semana"
              type="date"
              value={weekEnd}
              disabled
            />
          </div>

          <CurrencyInput
            label="Saldo Inicial (abertura)"
            value={form.openingBalance}
            onChange={(v) => handleChange('openingBalance', v)}
          />

          {/* Summary Section */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Calculo Automatico</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500">Entradas (estimadas)</p>
                <p className="text-lg font-semibold text-success-600">{formatCurrency(estimatedIncome)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Saidas (estimadas)</p>
                <p className="text-lg font-semibold text-danger-600">{formatCurrency(estimatedExpenses)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Saldo Esperado</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(expectedBalance)}</p>
              </div>
            </div>
          </div>

          <CurrencyInput
            label="Saldo Real (informado)"
            value={form.actualBalance}
            onChange={(v) => handleChange('actualBalance', v)}
          />

          {/* Difference */}
          <div className={`p-4 rounded-lg border ${difference === 0 ? 'bg-success-50 border-success-200' : difference > 0 ? 'bg-primary-50 border-primary-200' : 'bg-danger-50 border-danger-200'}`}>
            <div className="flex items-center gap-3">
              {difference === 0 ? (
                <Minus className="h-5 w-5 text-success-600" />
              ) : difference > 0 ? (
                <TrendingUp className="h-5 w-5 text-primary-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-danger-600" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-700">Diferenca</p>
                <p className={`text-xl font-bold ${difference === 0 ? 'text-success-600' : difference > 0 ? 'text-primary-600' : 'text-danger-600'}`}>
                  {formatCurrency(difference)}
                </p>
              </div>
            </div>
          </div>

          <Textarea
            label="Justificativa"
            value={form.justification}
            onChange={(e) => handleChange('justification', e.target.value)}
            placeholder="Justifique diferencas encontradas..."
            rows={3}
            hint={difference !== 0 ? 'Recomendado quando ha diferenca entre saldo esperado e real' : undefined}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={loading}>Criar Fechamento</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
