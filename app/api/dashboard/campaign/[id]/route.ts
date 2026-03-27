import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';
import { calculateCampaignMargin } from '@/lib/services/margin';
import { toNumber } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: { select: { id: true, name: true, clientType: true } },
        executive: { select: { id: true, name: true } },
        operation: { select: { id: true, name: true } },
        influencers: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            negotiatedValue: true,
            paidValue: true,
            openValue: true,
            status: true,
          },
        },
        receivables: {
          where: { deletedAt: null },
          select: {
            id: true,
            value: true,
            receivedValue: true,
            status: true,
            dueDate: true,
          },
        },
        reimbursements: {
          where: { deletedAt: null },
          select: {
            id: true,
            category: true,
            requestedValue: true,
            approvedValue: true,
            status: true,
          },
        },
        commissions: {
          where: { deletedAt: null },
          select: {
            id: true,
            role: true,
            calculatedValue: true,
            paidValue: true,
            status: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campanha não encontrada' }, { status: 404 });
    }

    const marginResult = await calculateCampaignMargin(id);

    const totalPaidInfluencers = campaign.influencers.reduce(
      (s, i) => s + toNumber(i.paidValue),
      0
    );

    const totalOpenInfluencers = campaign.influencers.reduce(
      (s, i) => s + toNumber(i.openValue),
      0
    );

    const totalReceivables = campaign.receivables.reduce(
      (s, r) => s + toNumber(r.value),
      0
    );

    const totalReceived = campaign.receivables
      .filter((r) => r.status === 'RECEBIDO')
      .reduce((s, r) => s + toNumber(r.receivedValue || r.value), 0);

    const totalPendingReceivables = campaign.receivables
      .filter((r) => r.status === 'PENDENTE')
      .reduce((s, r) => s + toNumber(r.value), 0);

    const totalOverdueReceivables = campaign.receivables
      .filter((r) => r.status === 'PENDENTE' && r.dueDate && r.dueDate < new Date())
      .reduce((s, r) => s + toNumber(r.value), 0);

    const totalApprovedReimbursements = campaign.reimbursements
      .filter((r) => ['APROVADO', 'APROVADO_PARCIAL', 'PAGO'].includes(r.status))
      .reduce((s, r) => s + toNumber(r.approvedValue), 0);

    const totalPendingReimbursements = campaign.reimbursements
      .filter((r) => ['ENVIADO', 'EM_ANALISE'].includes(r.status))
      .reduce((s, r) => s + toNumber(r.requestedValue), 0);

    const totalCommissions = campaign.commissions
      .filter((c) => c.status !== 'CANCELADA')
      .reduce((s, c) => s + toNumber(c.calculatedValue), 0);

    const totalPaidCommissions = campaign.commissions
      .filter((c) => c.status === 'PAGA')
      .reduce((s, c) => s + toNumber(c.paidValue || c.calculatedValue), 0);

    const influencersByStatus = {
      pendente: campaign.influencers.filter((i) => i.status === 'PENDENTE').length,
      parcial: campaign.influencers.filter((i) => i.status === 'PARCIAL').length,
      pago: campaign.influencers.filter((i) => i.status === 'PAGO').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          soldValue: toNumber(campaign.soldValue),
          client: campaign.client,
          executive: campaign.executive,
          operation: campaign.operation,
        },
        margin: marginResult,
        influencers: {
          count: campaign.influencers.length,
          totalNegotiated: marginResult.totalInfluencers,
          totalPaid: totalPaidInfluencers,
          totalOpen: totalOpenInfluencers,
          byStatus: influencersByStatus,
        },
        receivables: {
          count: campaign.receivables.length,
          total: totalReceivables,
          received: totalReceived,
          pending: totalPendingReceivables,
          overdue: totalOverdueReceivables,
        },
        reimbursements: {
          count: campaign.reimbursements.length,
          totalApproved: totalApprovedReimbursements,
          totalPending: totalPendingReimbursements,
        },
        commissions: {
          count: campaign.commissions.length,
          total: totalCommissions,
          paid: totalPaidCommissions,
        },
        profitability: {
          soldValue: marginResult.soldValue,
          totalCosts: marginResult.totalInfluencers + totalApprovedReimbursements + totalCommissions,
          margin: marginResult.margin,
          marginPercent: marginResult.marginPercent,
          netMargin: marginResult.margin - totalCommissions,
          netMarginPercent: marginResult.soldValue > 0
            ? Math.round(((marginResult.margin - totalCommissions) / marginResult.soldValue) * 10000) / 100
            : 0,
        },
      },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao carregar dashboard da campanha:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
