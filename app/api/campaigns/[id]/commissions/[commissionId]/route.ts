import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { updateCommissionSchema } from '@/lib/validators/commission';
import { logAudit } from '@/lib/services/audit';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO'];

interface RouteParams {
  params: Promise<{ id: string; commissionId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id, commissionId } = await params;
    const body = await request.json();
    const parsed = updateCommissionSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.commission.findFirst({
      where: { id: commissionId, campaignId: id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Comissão não encontrada nesta campanha' },
        { status: 404 }
      );
    }

    const { paidDate, ...rest } = parsed.data;
    const updateData: any = { ...rest };

    if (paidDate !== undefined) {
      updateData.paidDate = paidDate ? new Date(paidDate) : null;
    }

    // If marking as paid and no paidValue set, use calculatedValue
    if (updateData.status === 'PAGA' && !updateData.paidValue) {
      updateData.paidValue = existing.calculatedValue;
      if (!updateData.paidDate) {
        updateData.paidDate = new Date();
      }
    }

    const commission = await prisma.commission.update({
      where: { id: commissionId },
      data: updateData,
      include: {
        employee: { select: { id: true, name: true } },
      },
    });

    await logAudit(session.userId, 'UPDATE', 'Commission', commissionId, existing, commission);

    return NextResponse.json({ success: true, data: commission, message: 'Comissão atualizada com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar comissão:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
