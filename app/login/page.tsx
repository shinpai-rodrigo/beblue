'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Informe o email');
      return;
    }
    if (!password.trim()) {
      setError('Informe a senha');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary-600 mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">BeBlue</h1>
            <p className="text-sm text-slate-500 mt-1">Gestao Financeira</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              icon={<Mail className="h-4 w-4" />}
              autoComplete="email"
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              icon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            BeBlue v1.0 - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
