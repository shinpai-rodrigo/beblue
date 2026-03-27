import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { updateInfluencerSchema } from '@/lib/validators/influencer';
import { logAudit } from '@/lib/services/audit';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO', 'OPERACAO'];

interface RouteParams {
  params: Promise<{ id: string; influencerId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id, influencerId } = await params;
    const body = await request.json();
    const parsed = updateInfluencerSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.campaignInfluencer.findFirst({
      where: { id: influencerId, campaignId: id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Influenciador não encontrado nesta campanha' },
        { status: 404 }
      );
    }

    const { negotiationDate, paymentDeadline, dueDate, negotiatedValue, ...rest } = parsed.data;
    const updateData: any = { ...rest };

    if (negotiationDate !== undefined) updateData.negotiationDate = negotiationDate ? new Date(negotiationDate) : null;
    if (paymentDeadline !== undefined) updateData.paymentDeadline = paymentDeadline ? new Date(paymentDeadline) : null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    if (negotiatedValue !== undefined) {
      updateData.negotiatedValue = negotiatedValue;
      const paidValue = Number(existing.paidValue) || 0;
      updateData.openValue = negotiatedValue - paidValue;
    }

    const influencer = await prisma.campaignInfluencer.update({
      where: { id: influencerId },
      data: updateData,
    });

    await logAudit(session.userId, 'UPDATE', 'CampaignInfluencer', influencerId, existing, influencer);

    return NextResponse.json({ success: true, data: influencer, message: 'Influenciador atualizado com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar influenciador:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id, influencerId } = await params;

    const existing = await prisma.campaignInfluencer.findFirst({
      where: { id: influencerId, campaignId: id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Influenciador não encontrado nesta campanha' },
        { status: 404 }
      );
    }

    await prisma.campaignInfluencer.update({
      where: { id: influencerId },
      data: { deletedAt: new Date() },
    });

    await logAudit(session.userId, 'DELETE', 'CampaignInfluencer', influencerId, existing, null);

    return NextResponse.json({ success: true, message: 'Influenciador removido com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao remover influenciador:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
