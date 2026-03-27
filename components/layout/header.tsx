'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Bell, ChevronRight, User, LogOut, Settings } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clientes': 'Clientes',
  '/clientes/novo': 'Novo Cliente',
  '/funcionarios': 'Funcionarios',
  '/funcionarios/novo': 'Novo Funcionario',
  '/campanhas': 'Campanhas',
  '/campanhas/nova': 'Nova Campanha',
  '/receber': 'Contas a Receber',
  '/pagar': 'Contas a Pagar',
  '/reembolsos': 'Reembolsos',
  '/reembolsos/novo': 'Novo Reembolso',
  '/comissoes': 'Comissoes',
  '/centros-custo': 'Centros de Custo',
  '/centros-custo/novo': 'Novo Centro de Custo',
  '/fechamento': 'Fechamento Semanal',
  '/fechamento/novo': 'Novo Fechamento',
  '/configuracoes': 'Configuracoes',
  '/relatorios': 'Relatorios',
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    const title = pageTitles[path];
    if (title) {
      crumbs.push({ label: title, href: path });
    } else if (seg !== '(dashboard)') {
      crumbs.push({ label: seg, href: path });
    }
  }

  return crumbs;
}

function getPageTitle(pathname: string): string {
  for (const [key, val] of Object.entries(pageTitles)) {
    if (pathname === key) return val;
  }
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 2) {
    const base = `/${segments[0]}`;
    if (pageTitles[base]) return pageTitles[base];
  }
  return 'BeBlue';
}

function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = getBreadcrumbs(pathname);
  const title = getPageTitle(pathname);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {breadcrumbs.length > 1 && (
            <nav className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  {i < breadcrumbs.length - 1 ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-primary-600 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-700 font-medium">
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-danger-500 rounded-full" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary-600 text-white text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">
                {user?.name || 'Usuario'}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push('/configuracoes');
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Configuracoes
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger-600 hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export { Header };
