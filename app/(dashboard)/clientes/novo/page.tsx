'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const states = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
].map((s) => ({ value: s, label: s }));

export default function NovoClientePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const formatDocument = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome e obrigatorio';
    if (!form.document.trim()) errs.document = 'Documento e obrigatorio';
    else {
      const digits = form.document.replace(/\D/g, '');
      if (digits.length !== 11 && digits.length !== 14) {
        errs.document = 'Documento deve ser CPF (11 digitos) ou CNPJ (14 digitos)';
      }
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email invalido';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const payload = {
      ...form,
      document: form.document.replace(/\D/g, ''),
    };
    const { error } = await apiPost('/api/clients', payload);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Cliente criado com sucesso!');
      router.push('/clientes');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Novo Cliente</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome / Razao Social *"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="Nome completo ou razao social"
            />
            <Input
              label="Nome Fantasia"
              value={form.tradeName}
              onChange={(e) => handleChange('tradeName', e.target.value)}
              placeholder="Nome fantasia (opcional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="CPF/CNPJ *"
              value={form.document}
              onChange={(e) => handleChange('document', formatDocument(e.target.value))}
              error={errors.document}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              maxLength={18}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(00) 00000-0000"
            />
            <Input
              label="Endereco"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua, numero, complemento"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Cidade"
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Cidade"
            />
            <Select
              label="Estado"
              options={states}
              value={form.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="Selecione o estado"
            />
          </div>

          <Textarea
            label="Observacoes"
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Observacoes sobre o cliente..."
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Criar Cliente
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
