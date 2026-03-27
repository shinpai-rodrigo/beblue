'use client';

import { useState } from 'react';
import { useToast } from '@/lib/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Megaphone, DollarSign, Percent, Receipt, FileDown, Loader2 } from 'lucide-react';

interface ReportConfig {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  color: string;
}

const reports: ReportConfig[] = [
  {
    key: 'campaigns',
    title: 'Relatorio de Campanhas',
    description: 'Visao geral de todas as campanhas com metricas de vendas, margem e status.',
    icon: <Megaphone className="h-6 w-6" />,
    endpoint: '/api/reports/campaigns',
    color: 'bg-primary-100 text-primary-600',
  },
  {
    key: 'financial',
    title: 'Relatorio Financeiro',
    description: 'Receitas, despesas, margens e fluxo de caixa do periodo selecionado.',
    icon: <DollarSign className="h-6 w-6" />,
    endpoint: '/api/reports/financial',
    color: 'bg-success-100 text-success-600',
  },
  {
    key: 'commissions',
    title: 'Relatorio de Comissoes',
    description: 'Detalhamento de comissoes por funcionario, campanha e status.',
    icon: <Percent className="h-6 w-6" />,
    endpoint: '/api/reports/commissions',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    key: 'reimbursements',
    title: 'Relatorio de Reembolsos',
    description: 'Resumo de reembolsos por categoria, funcionario e status.',
    icon: <Receipt className="h-6 w-6" />,
    endpoint: '/api/reports/reimbursements',
    color: 'bg-warning-100 text-warning-600',
  },
];

export default function RelatoriosPage() {
  const toast = useToast();
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = async (report: ReportConfig) => {
    setGenerating(report.key);
    try {
      const res = await fetch(
        `${report.endpoint}?startDate=${startDate}&endDate=${endDate}&format=json`
      );
      if (!res.ok) throw new Error('Erro ao gerar relatorio');
      const data = await res.json();
      toast.success(`Relatorio "${report.title}" gerado com sucesso!`);
      // In production, this would open a viewer or download
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar relatorio');
    } finally {
      setGenerating(null);
    }
  };

  const handleExportCSV = async (report: ReportConfig) => {
    setGenerating(`${report.key}-csv`);
    try {
      const res = await fetch(
        `${report.endpoint}?startDate=${startDate}&endDate=${endDate}&format=csv`
      );
      if (!res.ok) throw new Error('Erro ao exportar');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.key}-${startDate}-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Arquivo CSV exportado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao exportar CSV');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">Relatorios</h2>

      <Card>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          label="Periodo do relatorio"
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card key={report.key} className="flex flex-col">
            <div className="flex items-start gap-4 mb-4">
              <div className={`rounded-lg p-3 ${report.color}`}>
                {report.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-slate-900">{report.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{report.description}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-auto pt-4 border-t border-slate-200">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleGenerate(report)}
                loading={generating === report.key}
                disabled={!!generating}
              >
                Gerar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCSV(report)}
                loading={generating === `${report.key}-csv`}
                disabled={!!generating}
              >
                <FileDown className="h-4 w-4" /> Exportar CSV
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
