'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/hooks/use-fetch';
import { useToast } from '@/lib/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const roleOptions = [
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'OPERACAO', label: 'Operação' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'GESTOR', label: 'Gestor' },
];

export default function NovoFuncionarioPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [createUser, setCreateUser] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    role: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nome e obrigatorio';
    if (!form.email.trim()) errs.email = 'Email e obrigatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalido';
    if (!form.role) errs.role = 'Funcao e obrigatoria';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const { error } = await apiPost('/api/employees', {
      ...form,
      createUser,
    });
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Funcionario criado com sucesso!');
      router.push('/funcionarios');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Novo Funcionario</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome Completo *"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              placeholder="Nome completo"
            />
            <Input
              label="Email *"
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
              label="Cargo"
              value={form.position}
              onChange={(e) => handleChange('position', e.target.value)}
              placeholder="Ex: Gerente de Contas"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Departamento"
              value={form.department}
              onChange={(e) => handleChange('department', e.target.value)}
              placeholder="Ex: Comercial"
            />
            <Select
              label="Funcao no Sistema *"
              options={roleOptions}
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              error={errors.role}
              placeholder="Selecione a funcao"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              id="createUser"
              checked={createUser}
              onChange={(e) => setCreateUser(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="createUser" className="text-sm text-slate-700">
              Criar conta de acesso ao sistema (o email sera o login e uma senha temporaria sera gerada)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Criar Funcionario
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
