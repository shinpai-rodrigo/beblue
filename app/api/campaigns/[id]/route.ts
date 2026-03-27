import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { updateCampaignSchema } from '@/lib/validators/campaign';
import { logAudit } from '@/lib/services/audit';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO', 'COMERCIAL', 'OPERACAO'];
const ALLOWED_ROLES_READ = ['ADMIN', 'FINANCEIRO', 'COMERCIAL', 'OPERACAO', 'GESTOR'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES_READ);
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: { select: { id: true, name: true, clientType: true } },
        executive: { select: { id: true, name: true } },
        operation: { select: { id: true, name: true } },
        costCenter: { select: { id: true, name: true } },
        influencers: {
          include: {
            payments: {
              orderBy: { paymentDate: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        receivables: {
          orderBy: { dueDate: 'asc' },
          include: {
            client: { select: { id: true, name: true } },
          },
        },
        reimbursements: {
          include: {
            employee: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        commissions: {
          include: {
            employee: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campanha não encontrada' }, { status: 404 });
    }

    const soldValue = toNumber(campaign.soldValue);

    const totalInfluencers = campaign.influencers.reduce(
      (sum, inf) => sum + toNumber(inf.negotiatedValue),
      0
    );

    const totalPaidInfluencers = campaign.influencers.reduce(
      (sum, inf) => sum + toNumber(inf.paidValue),
      0
    );

    const totalReimbursements = campaign.reimbursements
      .filter((r) => ['APROVADO', 'APROVADO_PARCIAL', 'PAGO'].includes(r.status))
      .reduce((sum, r) => sum + toNumber(r.approvedValue), 0);

    const totalReceivables = campaign.receivables.reduce(
      (sum, r) => sum + toNumber(r.value),
      0
    );

    const totalReceived = campaign.receivables
      .filter((r) => r.status === 'PAGA')
      .reduce((sum, r) => sum + toNumber(r.receivedValue || r.value), 0);

    const totalCommissions = campaign.commissions
      .filter((c) => c.status !== 'CANCELADA')
      .reduce((sum, c) => sum + toNumber(c.calculatedValue), 0);

    const margin = soldValue - totalInfluencers - totalReimbursements;
    const marginPercent = soldValue > 0 ? Math.round((margin / soldValue) * 10000) / 100 : 0;

    const influencers = campaign.influencers.map((inf) => ({
      ...inf,
      negotiatedValue: toNumber(inf.negotiatedValue),
      paidValue: toNumber(inf.paidValue),
      openValue: toNumber(inf.openValue),
      payments: inf.payments.map((p) => ({
        ...p,
        value: toNumber(p.value),
      })),
    }));

    const receivables = campaign.receivables.map((r) => ({
      ...r,
      value: toNumber(r.value),
      receivedValue: r.receivedValue ? toNumber(r.receivedValue) : null,
    }));

    const reimbursements = campaign.reimbursements.map((r) => ({
      ...r,
      requestedValue: toNumber(r.requestedValue),
      approvedValue: r.approvedValue ? toNumber(r.approvedValue) : null,
    }));

    const commissions = campaign.commissions.map((c) => ({
      ...c,
      baseValue: toNumber(c.baseValue),
      percentage: toNumber(c.percentage),
      calculatedValue: toNumber(c.calculatedValue),
      paidValue: c.paidValue ? toNumber(c.paidValue) : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        soldValue,
        influencers,
        receivables,
        reimbursements,
        commissions,
        totals: {
          totalInfluencers,
          totalPaidInfluencers,
          totalReimbursements,
          totalReceivables,
          totalReceived,
          totalCommissions,
          margin,
          marginPercent,
        },
      },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao buscar campanha:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateCampaignSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.campaign.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Campanha não encontrada' }, { status: 404 });
    }

    const { startDate, endDate, ...rest } = parsed.data;
    const updateData: any = { ...rest };
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        executive: { select: { id: true, name: true } },
        operation: { select: { id: true, name: true } },
      },
    });

    await logAudit(session.userId, 'UPDATE', 'Campaign', id, existing, campaign);

    return NextResponse.json({ success: true, data: campaign, message: 'Campanha atualizada com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar campanha:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const existing = await prisma.campaign.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Campanha não encontrada' }, { status: 404 });
    }

    await prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit(session.userId, 'DELETE', 'Campaign', id, existing, null);

    return NextResponse.json({ success: true, message: 'Campanha removida com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao remover campanha:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
