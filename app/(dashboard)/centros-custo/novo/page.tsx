'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function NovoCentroCustoPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome e obrigatorio';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { error } = await apiPost('/api/cost-centers', form);
    setLoading(false);

    if (error) { toast.error(error); }
    else { toast.success('Centro de custo criado!'); router.push('/centros-custo'); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Novo Centro de Custo</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Nome *" value={form.name} onChange={(e) => handleChange('name', e.target.value)} error={errors.name} placeholder="Nome do centro de custo" />
          <Input label="Codigo" value={form.code} onChange={(e) => handleChange('code', e.target.value)} placeholder="Codigo identificador (opcional)" />
          <Textarea label="Descricao" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Descricao..." rows={3} />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={loading}>Criar</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
