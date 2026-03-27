import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';
import { toNumber } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Active campaigns in the period
    const campaigns = await prisma.campaign.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['CANCELADA'] },
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
          { startDate: { lte: startDate }, endDate: { gte: endDate } },
          { startDate: null },
        ],
      },
      include: {
        client: { select: { name: true } },
        influencers: {
          where: { deletedAt: null },
          select: { negotiatedValue: true, paidValue: true },
        },
        reimbursements: {
          where: { deletedAt: null, status: { in: ['APROVADO', 'APROVADO_PARCIAL', 'PAGO'] } },
          select: { approvedValue: true },
        },
      },
    });

    let totalSold = 0;
    const campaignMetrics: Array<{
      id: string;
      name: string;
      clientName: string;
      soldValue: number;
      margin: number;
      marginPercent: number;
    }> = [];

    for (const c of campaigns) {
      const soldValue = toNumber(c.soldValue);
      totalSold += soldValue;

      const totalInf = c.influencers.reduce((s, i) => s + toNumber(i.negotiatedValue), 0);
      const totalReimb = c.reimbursements.reduce((s, r) => s + toNumber(r.approvedValue), 0);
      const margin = soldValue - totalInf - totalReimb;
      const marginPercent = soldValue > 0 ? Math.round((margin / soldValue) * 10000) / 100 : 0;

      campaignMetrics.push({
        id: c.id,
        name: c.name,
        clientName: c.client?.name || '',
        soldValue,
        margin,
        marginPercent,
      });
    }

    // Receivables
    const receivables = await prisma.receivable.findMany({
      where: { deletedAt: null },
      select: { value: true, receivedValue: true, status: true },
    });

    let totalReceivable = 0;
    let totalReceived = 0;
    for (const r of receivables) {
      if (r.status === 'EMITIDA' || r.status === 'ENVIADA' || r.status === 'VENCIDA') {
        totalReceivable += toNumber(r.value);
      }
      if (r.status === 'PAGA') {
        totalReceived += toNumber(r.receivedValue || r.value);
      }
    }

    // Payables: pending influencer payments
    const pendingInfluencers = await prisma.campaignInfluencer.findMany({
      where: { deletedAt: null, status: { in: ['PENDENTE', 'PARCIAL'] } },
      select: { openValue: true, paidValue: true },
    });

    let totalPayable = pendingInfluencers.reduce((s, i) => s + toNumber(i.openValue), 0);
    let totalPaid = pendingInfluencers.reduce((s, i) => s + toNumber(i.paidValue), 0);

    // Add approved reimbursements to payable
    const approvedReimbursements = await prisma.reimbursement.findMany({
      where: { deletedAt: null, status: { in: ['APROVADO', 'APROVADO_PARCIAL'] } },
      select: { approvedValue: true },
    });
    totalPayable += approvedReimbursements.reduce((s, r) => s + toNumber(r.approvedValue), 0);

    // Add approved commissions to payable
    const approvedCommissions = await prisma.commission.findMany({
      where: { deletedAt: null, status: { in: ['CALCULADA', 'APROVADA'] } },
      select: { calculatedValue: true },
    });
    totalPayable += approvedCommissions.reduce((s, c) => s + toNumber(c.calculatedValue), 0);

    // Paid reimbursements + commissions
    const paidReimbursements = await prisma.reimbursement.findMany({
      where: { deletedAt: null, status: 'PAGO' },
      select: { approvedValue: true },
    });
    totalPaid += paidReimbursements.reduce((s, r) => s + toNumber(r.approvedValue), 0);

    const paidCommissions = await prisma.commission.findMany({
      where: { deletedAt: null, status: 'PAGA' },
      select: { paidValue: true, calculatedValue: true },
    });
    totalPaid += paidCommissions.reduce((s, c) => s + toNumber(c.paidValue || c.calculatedValue), 0);

    // Commission totals
    const allCommissions = await prisma.commission.findMany({
      where: { deletedAt: null },
      select: { calculatedValue: true, paidValue: true, status: true },
    });

    let totalCommissionPending = 0;
    let totalCommissionPaid = 0;
    for (const c of allCommissions) {
      if (['CALCULADA', 'APROVADA'].includes(c.status)) {
        totalCommissionPending += toNumber(c.calculatedValue);
      }
      if (c.status === 'PAGA') {
        totalCommissionPaid += toNumber(c.paidValue || c.calculatedValue);
      }
    }

    // Last closing difference
    const lastClosing = await prisma.weeklyClosing.findFirst({
      orderBy: { weekEnd: 'desc' },
      select: { difference: true },
    });
    const lastClosingDifference = lastClosing ? toNumber(lastClosing.difference) : null;

    // Total margin across all campaigns
    const totalMargin = campaignMetrics.reduce((s, c) => s + c.margin, 0);

    // Top 5 by margin
    const topCampaignsByMargin = [...campaignMetrics]
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5);

    // Top 5 by revenue
    const topCampaignsByRevenue = [...campaignMetrics]
      .sort((a, b) => b.soldValue - a.soldValue)
      .slice(0, 5);

    // Monthly revenue for last 6 months
    const monthlyRevenue: Array<{ month: string; revenue: number; expenses: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = monthStart.toISOString().substring(0, 7);

      const monthReceivables = await prisma.receivable.findMany({
        where: {
          deletedAt: null,
          status: 'PAGA',
          receivedDate: { gte: monthStart, lte: monthEnd },
        },
        select: { receivedValue: true, value: true },
      });

      const revenue = monthReceivables.reduce(
        (s, r) => s + toNumber(r.receivedValue || r.value),
        0
      );

      const monthPayments = await prisma.influencerPayment.findMany({
        where: { paymentDate: { gte: monthStart, lte: monthEnd } },
        select: { value: true },
      });

      const monthReimbPaid = await prisma.reimbursement.findMany({
        where: { deletedAt: null, status: 'PAGO', paidDate: { gte: monthStart, lte: monthEnd } },
        select: { approvedValue: true },
      });

      const monthCommPaid = await prisma.commission.findMany({
        where: { deletedAt: null, status: 'PAGA', paidDate: { gte: monthStart, lte: monthEnd } },
        select: { paidValue: true, calculatedValue: true },
      });

      const expenses =
        monthPayments.reduce((s, p) => s + toNumber(p.value), 0) +
        monthReimbPaid.reduce((s, r) => s + toNumber(r.approvedValue), 0) +
        monthCommPaid.reduce((s, c) => s + toNumber(c.paidValue || c.calculatedValue), 0);

      monthlyRevenue.push({ month: monthLabel, revenue, expenses });
    }

    // Recent activity
    const recentLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });

    const recentActivity = recentLogs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || 'Sistema',
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalSold,
        totalReceivable,
        totalReceived,
        totalPayable,
        totalPaid,
        totalMargin,
        totalCommissionPending,
        totalCommissionPaid,
        lastClosingDifference,
        topCampaignsByMargin,
        topCampaignsByRevenue,
        monthlyRevenue,
        recentActivity,
      },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao carregar dashboard:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
