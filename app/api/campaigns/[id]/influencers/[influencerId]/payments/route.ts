import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { createPaymentSchema } from '@/lib/validators/influencer';
import { logAudit } from '@/lib/services/audit';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO'];

interface RouteParams {
  params: Promise<{ id: string; influencerId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id, influencerId } = await params;
    const body = await request.json();
    const parsed = createPaymentSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const influencer = await prisma.campaignInfluencer.findFirst({
      where: { id: influencerId, campaignId: id, deletedAt: null },
    });

    if (!influencer) {
      return NextResponse.json(
        { success: false, error: 'Influenciador não encontrado nesta campanha' },
        { status: 404 }
      );
    }

    const openValue = toNumber(influencer.openValue);
    const paymentValue = parsed.data.value;

    if (paymentValue > openValue + 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: `Valor do pagamento (R$ ${paymentValue.toFixed(2)}) excede o valor em aberto (R$ ${openValue.toFixed(2)})`,
        },
        { status: 400 }
      );
    }

    const { paymentDate, ...paymentRest } = parsed.data;

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.influencerPayment.create({
        data: {
          ...paymentRest,
          influencerId,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        },
      });

      const newPaidValue = toNumber(influencer.paidValue) + paymentValue;
      const newOpenValue = toNumber(influencer.negotiatedValue) - newPaidValue;
      const newStatus = newOpenValue <= 0.01 ? 'PAGO' : 'PARCIAL';

      await tx.campaignInfluencer.update({
        where: { id: influencerId },
        data: {
          paidValue: newPaidValue,
          openValue: Math.max(0, newOpenValue),
          status: newStatus,
        },
      });

      return newPayment;
    });

    await logAudit(session.userId, 'CREATE', 'InfluencerPayment', payment.id, null, payment);

    return NextResponse.json(
      { success: true, data: payment, message: 'Pagamento registrado com sucesso' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao registrar pagamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
