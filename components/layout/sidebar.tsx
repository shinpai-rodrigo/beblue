'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Megaphone,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  Percent,
  Landmark,
  CalendarCheck,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Zap,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Funcionarios', href: '/funcionarios', icon: UserCog },
  { name: 'Campanhas', href: '/campanhas', icon: Megaphone },
  { name: 'Contas a Receber', href: '/receber', icon: ArrowDownCircle },
  { name: 'Contas a Pagar', href: '/pagar', icon: ArrowUpCircle },
  { name: 'Reembolsos', href: '/reembolsos', icon: Receipt },
  { name: 'Comissoes', href: '/comissoes', icon: Percent },
  { name: 'Centros de Custo', href: '/centros-custo', icon: Landmark },
  { name: 'Fechamento Semanal', href: '/fechamento', icon: CalendarCheck },
  { name: 'Configuracoes', href: '/configuracoes', icon: Settings },
  { name: 'Relatorios', href: '/relatorios', icon: BarChart3 },
];

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  FINANCEIRO: 'Financeiro',
  COMERCIAL: 'Comercial',
  OPERACAO: 'Operacao',
  VISUALIZADOR: 'Visualizador',
};

function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary-600">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">BeBlue</h1>
          <p className="text-xs text-slate-400">Gestao Financeira</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="px-4 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary-600 text-white text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <Badge variant="info" className="mt-0.5">
                {roleLabels[user.role] || user.role}
              </Badge>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-900 text-white shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-[#0F172A]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0F172A]">
        {navContent}
      </aside>
    </>
  );
}

export { Sidebar };
