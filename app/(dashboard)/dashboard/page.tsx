'use client';

import { useState, useMemo } from 'react';
import { useFetch } from '@/lib/hooks/use-fetch';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { SkeletonCard, PageLoading } from '@/components/ui/loading';
import {
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Percent,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { DashboardData } from '@/lib/types';

export default function DashboardPage() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const { data, loading, error } = useFetch<DashboardData>(
    `/api/dashboard?startDate=${startDate}&endDate=${endDate}`
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-danger-50 border border-danger-200 p-6 text-center">
        <p className="text-sm text-danger-700">Erro ao carregar dashboard: {error}</p>
      </div>
    );
  }

  const d = data || {
    totalSold: 0,
    totalReceivable: 0,
    totalReceived: 0,
    totalPayable: 0,
    totalPaid: 0,
    totalMargin: 0,
    totalCommissionPending: 0,
    totalCommissionPaid: 0,
    topCampaignsByMargin: [],
    topCampaignsByRevenue: [],
    monthlyRevenue: [],
    recentActivity: [],
    lastClosingDifference: null,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Visao Geral</h2>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="h-6 w-6" />}
          label="Total Vendido"
          value={formatCurrency(d.totalSold)}
          color="blue"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Total a Receber"
          value={formatCurrency(d.totalReceivable)}
          color="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          label="Total Recebido"
          value={formatCurrency(d.totalReceived)}
          color="green"
        />
        <StatCard
          icon={<ArrowUpCircle className="h-6 w-6" />}
          label="Total a Pagar"
          value={formatCurrency(d.totalPayable)}
          color="red"
        />
        <StatCard
          icon={<ArrowDownCircle className="h-6 w-6" />}
          label="Total Pago"
          value={formatCurrency(d.totalPaid)}
          color="emerald"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Margem Total"
          value={formatCurrency(d.totalMargin)}
          color="purple"
          changeType={d.totalMargin >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          icon={<Percent className="h-6 w-6" />}
          label="Comissoes Previstas"
          value={formatCurrency(d.totalCommissionPending)}
          color="orange"
        />
        <StatCard
          icon={<Wallet className="h-6 w-6" />}
          label="Comissoes Pagas"
          value={formatCurrency(d.totalCommissionPaid)}
          color="teal"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Receitas vs Despesas" subtitle="Ultimos 6 meses">
          {d.monthlyRevenue.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#0F172A' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="revenue" name="Receitas" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-slate-500">
              Sem dados para o periodo selecionado
            </div>
          )}
        </Card>

        <Card title="Top 5 Campanhas por Margem">
          {d.topCampaignsByMargin.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.topCampaignsByMargin} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="margin" name="Margem" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-slate-500">
              Sem dados para o periodo selecionado
            </div>
          )}
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Campanhas por Margem" noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Campanha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Margem</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {d.topCampaignsByMargin.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                      Nenhuma campanha encontrada
                    </td>
                  </tr>
                ) : (
                  d.topCampaignsByMargin.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm font-medium text-slate-900">{c.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{c.clientName}</td>
                      <td className={`px-6 py-3 text-sm text-right font-medium ${c.margin >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {formatCurrency(c.margin)}
                      </td>
                      <td className={`px-6 py-3 text-sm text-right ${c.marginPercent >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {c.marginPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Atividade Recente" noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Acao</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(!d.recentActivity || d.recentActivity.length === 0) ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">
                      Nenhuma atividade recente
                    </td>
                  </tr>
                ) : (
                  d.recentActivity.slice(0, 10).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-900">
                        <span className="font-medium">{a.action}</span>
                        <span className="text-slate-500"> em {a.entity}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">{a.userName}</td>
                      <td className="px-6 py-3 text-sm text-slate-500">{formatDate(a.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
