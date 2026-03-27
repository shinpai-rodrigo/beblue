import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { toNumber } from '@/lib/types';
import { sanitizeCsvQuotedCell, sanitizeCsvCell } from '@/lib/utils/csv';
import { logError } from '@/lib/logger';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO', 'COMERCIAL', 'GESTOR'];

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { searchParams } = new URL(request.url);

    const format = searchParams.get('format') || 'json';
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const executiveId = searchParams.get('executiveId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { deletedAt: null };

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (executiveId) where.executiveId = executiveId;

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        client: { select: { name: true, clientType: true } },
        executive: { select: { name: true } },
        operation: { select: { name: true } },
        costCenter: { select: { name: true } },
        influencers: {
          where: { deletedAt: null },
          select: { negotiatedValue: true, paidValue: true },
        },
        receivables: {
          where: { deletedAt: null },
          select: { value: true, receivedValue: true, status: true },
        },
        reimbursements: {
          where: { deletedAt: null, status: { in: ['APROVADO', 'APROVADO_PARCIAL', 'PAGO'] } },
          select: { approvedValue: true },
        },
        commissions: {
          where: { deletedAt: null, status: { notIn: ['CANCELADA'] } },
          select: { calculatedValue: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = campaigns.map((c) => {
      const soldValue = toNumber(c.soldValue);
      const totalInfluencers = c.influencers.reduce((s, i) => s + toNumber(i.negotiatedValue), 0);
      const totalPaidInfluencers = c.influencers.reduce((s, i) => s + toNumber(i.paidValue), 0);
      const totalReimbursements = c.reimbursements.reduce((s, r) => s + toNumber(r.approvedValue), 0);
      const totalReceivables = c.receivables.reduce((s, r) => s + toNumber(r.value), 0);
      const totalReceived = c.receivables
        .filter((r) => r.status === 'RECEBIDO')
        .reduce((s, r) => s + toNumber(r.receivedValue || r.value), 0);
      const totalCommissions = c.commissions.reduce((s, cm) => s + toNumber(cm.calculatedValue), 0);
      const margin = soldValue - totalInfluencers - totalReimbursements;
      const marginPercent = soldValue > 0 ? Math.round((margin / soldValue) * 10000) / 100 : 0;

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        clientName: c.client?.name || '',
        clientType: c.client?.clientType || '',
        executiveName: c.executive?.name || '',
        operationName: c.operation?.name || '',
        costCenterName: c.costCenter?.name || '',
        startDate: c.startDate,
        endDate: c.endDate,
        soldValue,
        totalInfluencers,
        totalPaidInfluencers,
        totalReimbursements,
        totalReceivables,
        totalReceived,
        totalCommissions,
        margin,
        marginPercent,
        influencerCount: c.influencers.length,
      };
    });

    if (format === 'csv') {
      const headers = [
        'ID', 'Nome', 'Status', 'Cliente', 'Tipo Cliente', 'Executivo', 'Operacional',
        'Centro de Custo', 'Data Início', 'Data Fim', 'Valor Vendido', 'Total Influenciadores',
        'Total Pago Influenciadores', 'Total Reembolsos', 'Total Recebíveis', 'Total Recebido',
        'Total Comissões', 'Margem', 'Margem %', 'Qtd Influenciadores',
      ];

      const rows = data.map((d) => [
        sanitizeCsvCell(d.id),
        sanitizeCsvQuotedCell(d.name),
        sanitizeCsvCell(d.status),
        sanitizeCsvQuotedCell(d.clientName),
        sanitizeCsvCell(d.clientType),
        sanitizeCsvQuotedCell(d.executiveName),
        sanitizeCsvQuotedCell(d.operationName),
        sanitizeCsvQuotedCell(d.costCenterName),
        d.startDate?.toISOString().split('T')[0] || '',
        d.endDate?.toISOString().split('T')[0] || '',
        d.soldValue.toFixed(2),
        d.totalInfluencers.toFixed(2),
        d.totalPaidInfluencers.toFixed(2),
        d.totalReimbursements.toFixed(2),
        d.totalReceivables.toFixed(2),
        d.totalReceived.toFixed(2),
        d.totalCommissions.toFixed(2),
        d.margin.toFixed(2),
        d.marginPercent.toFixed(2),
        d.influencerCount,
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-campanhas-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    logError('reports/campaigns', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
