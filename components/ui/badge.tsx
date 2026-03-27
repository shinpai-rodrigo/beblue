'use client';

import { cn } from '@/lib/utils/format';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-100 text-success-800 ring-success-600/20',
  warning: 'bg-warning-100 text-warning-800 ring-warning-600/20',
  danger: 'bg-danger-100 text-danger-800 ring-danger-600/20',
  info: 'bg-primary-100 text-primary-800 ring-primary-600/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-600/20',
  primary: 'bg-primary-100 text-primary-800 ring-primary-600/20',
};

const statusVariantMap: Record<string, BadgeVariant> = {
  ATIVA: 'success',
  PAGO: 'success',
  PAGA: 'success',
  APROVADO: 'success',
  APROVADA: 'success',
  CONCILIADO: 'success',
  CONCILIADA: 'success',
  FECHADO: 'success',
  FECHADA: 'success',
  RECEBIDO: 'success',
  RECEBIDA: 'success',
  ATIVO: 'success',
  PENDENTE: 'warning',
  EM_ANALISE: 'warning',
  ENVIADO: 'warning',
  ENVIADA: 'warning',
  CALCULADA: 'warning',
  CALCULADO: 'warning',
  ABERTO: 'warning',
  ABERTA: 'warning',
  VENCIDO: 'danger',
  VENCIDA: 'danger',
  CANCELADA: 'danger',
  CANCELADO: 'danger',
  REJEITADO: 'danger',
  REJEITADA: 'danger',
  INATIVO: 'danger',
  INATIVA: 'danger',
  RASCUNHO: 'info',
  PARCIAL: 'info',
  APROVADO_PARCIAL: 'info',
  ENCERRADA: 'neutral',
  ENCERRADO: 'neutral',
  PAUSADA: 'neutral',
  PAUSADO: 'neutral',
};

function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

function getVariantFromStatus(status: string): BadgeVariant {
  return statusVariantMap[status] || 'neutral';
}

function Badge({ children, variant, className }: BadgeProps) {
  const text = typeof children === 'string' ? children : '';
  const resolvedVariant = variant || getVariantFromStatus(text);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantClasses[resolvedVariant],
        className
      )}
    >
      {typeof children === 'string' ? getStatusLabel(children) : children}
    </span>
  );
}

export { Badge, getVariantFromStatus, getStatusLabel };
export type { BadgeProps, BadgeVariant };
