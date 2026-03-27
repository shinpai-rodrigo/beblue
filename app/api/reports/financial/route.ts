import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO'];

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const format = searchParams.get('format') || 'json';

    // Revenue: receivables received in period
    const receivedInPeriod = await prisma.receivable.findMany({
      where: {
        deletedAt: null,
        status: 'RECEBIDO',
        receivedDate: { gte: startDate, lte: endDate },
      },
      include: {
        campaign: { select: { name: true } },
        client: { select: { name: true } },
      },
    });

    const totalRevenue = receivedInPeriod.reduce(
      (s, r) => s + toNumber(r.receivedValue || r.value),
      0
    );

    // Expenses: influencer payments in period
    const influencerPayments = await prisma.influencerPayment.findMany({
      where: { paymentDate: { gte: startDate, lte: endDate } },
      include: {
        influencer: {
          select: { name: true, campaign: { select: { name: true } } },
        },
      },
    });

    const totalInfluencerPayments = influencerPayments.reduce(
      (s, p) => s + toNumber(p.value),
      0
    );

    // Expenses: reimbursements paid in period
    const reimbursementsPaid = await prisma.reimbursement.findMany({
      where: {
        deletedAt: null,
        status: 'PAGO',
        paidDate: { gte: startDate, lte: endDate },
      },
      include: {
        employee: { select: { name: true } },
      },
    });

    const totalReimbursementsPaid = reimbursementsPaid.reduce(
      (s, r) => s + toNumber(r.approvedValue || r.requestedValue),
      0
    );

    // Expenses: commissions paid in period
    const commissionsPaid = await prisma.commission.findMany({
      where: {
        deletedAt: null,
        status: 'PAGA',
        paidDate: { gte: startDate, lte: endDate },
      },
      include: {
        employee: { select: { name: true } },
        campaign: { select: { name: true } },
      },
    });

    const totalCommissionsPaid = commissionsPaid.reduce(
      (s, c) => s + toNumber(c.paidValue || c.calculatedValue),
      0
    );

    const totalExpenses = totalInfluencerPayments + totalReimbursementsPaid + totalCommissionsPaid;
    const netResult = totalRevenue - totalExpenses;

    // Pending receivables
    const pendingReceivables = await prisma.receivable.findMany({
      where: {
        deletedAt: null,
        status: 'PENDENTE',
        dueDate: { gte: startDate, lte: endDate },
      },
      select: { value: true, dueDate: true },
    });

    const totalPendingReceivables = pendingReceivables.reduce(
      (s, r) => s + toNumber(r.value),
      0
    );

    // Overdue receivables
    const overdueReceivables = await prisma.receivable.findMany({
      where: {
        deletedAt: null,
        status: 'PENDENTE',
        dueDate: { lt: new Date() },
      },
      select: { value: true },
    });

    const totalOverdue = overdueReceivables.reduce(
      (s, r) => s + toNumber(r.value),
      0
    );

    const data = {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      revenue: {
        total: totalRevenue,
        count: receivedInPeriod.length,
        items: receivedInPeriod.map((r) => ({
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          value: toNumber(r.receivedValue || r.value),
          date: r.receivedDate,
          campaignName: r.campaign?.name,
          clientName: r.client?.name,
        })),
      },
      expenses: {
        total: totalExpenses,
        influencerPayments: {
          total: totalInfluencerPayments,
          count: influencerPayments.length,
        },
        reimbursements: {
          total: totalReimbursementsPaid,
          count: reimbursementsPaid.length,
        },
        commissions: {
          total: totalCommissionsPaid,
          count: commissionsPaid.length,
        },
      },
      netResult,
      pendingReceivables: {
        total: totalPendingReceivables,
        count: pendingReceivables.length,
      },
      overdueReceivables: {
        total: totalOverdue,
        count: overdueReceivables.length,
      },
    };

    if (format === 'csv') {
      const lines = [
        'Relatório Financeiro',
        `Período: ${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`,
        '',
        'Resumo',
        `Receita Total,${totalRevenue.toFixed(2)}`,
        `Despesa Total,${totalExpenses.toFixed(2)}`,
        `  Pagamentos Influenciadores,${totalInfluencerPayments.toFixed(2)}`,
        `  Reembolsos Pagos,${totalReimbursementsPaid.toFixed(2)}`,
        `  Comissões Pagas,${totalCommissionsPaid.toFixed(2)}`,
        `Resultado Líquido,${netResult.toFixed(2)}`,
        `Recebíveis Pendentes,${totalPendingReceivables.toFixed(2)}`,
        `Recebíveis Vencidos,${totalOverdue.toFixed(2)}`,
      ];

      const csv = lines.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao gerar relatório financeiro:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
