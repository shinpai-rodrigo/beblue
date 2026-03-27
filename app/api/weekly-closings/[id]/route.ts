import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { updateClosingSchema } from '@/lib/validators/closing';
import { logAudit } from '@/lib/services/audit';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const closing = await prisma.weeklyClosing.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!closing) {
      return NextResponse.json({ success: false, error: 'Fechamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...closing,
        openingBalance: toNumber(closing.openingBalance),
        totalIncome: toNumber(closing.totalIncome),
        totalExpenses: toNumber(closing.totalExpenses),
        expectedBalance: toNumber(closing.expectedBalance),
        actualBalance: toNumber(closing.actualBalance),
        difference: toNumber(closing.difference),
        entries: closing.entries.map((e) => ({
          ...e,
          value: toNumber(e.value),
        })),
      },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao buscar fechamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateClosingSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.weeklyClosing.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Fechamento não encontrado' }, { status: 404 });
    }

    if (existing.status === 'FECHADO' && parsed.data.status !== 'ABERTO') {
      return NextResponse.json(
        { success: false, error: 'Fechamento já foi concluído. Reabra para editar.' },
        { status: 400 }
      );
    }

    const updateData: any = { ...parsed.data };

    // Recalculate difference if actualBalance changed
    if (parsed.data.actualBalance !== undefined) {
      const expectedBalance = toNumber(existing.expectedBalance);
      updateData.difference = parsed.data.actualBalance - expectedBalance;
    }

    const closing = await prisma.weeklyClosing.update({
      where: { id },
      data: updateData,
    });

    await logAudit(session.userId, 'UPDATE', 'WeeklyClosing', id, existing, closing);

    return NextResponse.json({
      success: true,
      data: {
        ...closing,
        openingBalance: toNumber(closing.openingBalance),
        totalIncome: toNumber(closing.totalIncome),
        totalExpenses: toNumber(closing.totalExpenses),
        expectedBalance: toNumber(closing.expectedBalance),
        actualBalance: toNumber(closing.actualBalance),
        difference: toNumber(closing.difference),
      },
      message: 'Fechamento atualizado com sucesso',
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar fechamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
