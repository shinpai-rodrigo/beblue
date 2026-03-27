import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { createInfluencerSchema } from '@/lib/validators/influencer';
import { logAudit } from '@/lib/services/audit';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO', 'OPERACAO'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({ where: { id, deletedAt: null } });
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campanha não encontrada' }, { status: 404 });
    }

    const influencers = await prisma.campaignInfluencer.findMany({
      where: { campaignId: id, deletedAt: null },
      include: {
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = influencers.map((inf) => ({
      ...inf,
      negotiatedValue: toNumber(inf.negotiatedValue),
      paidValue: toNumber(inf.paidValue),
      openValue: toNumber(inf.openValue),
      payments: inf.payments.map((p) => ({
        ...p,
        value: toNumber(p.value),
      })),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar influenciadores:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json();
    const parsed = createInfluencerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const campaign = await prisma.campaign.findFirst({ where: { id, deletedAt: null } });
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campanha não encontrada' }, { status: 404 });
    }

    const { negotiationDate, paymentDeadline, dueDate, ...rest } = parsed.data;

    const influencer = await prisma.campaignInfluencer.create({
      data: {
        ...rest,
        campaignId: id,
        openValue: rest.negotiatedValue,
        paidValue: 0,
        status: 'PENDENTE',
        negotiationDate: negotiationDate ? new Date(negotiationDate) : null,
        paymentDeadline: paymentDeadline ? new Date(paymentDeadline) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await logAudit(session.userId, 'CREATE', 'CampaignInfluencer', influencer.id, null, influencer);

    return NextResponse.json(
      { success: true, data: influencer, message: 'Influenciador adicionado com sucesso' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao adicionar influenciador:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
