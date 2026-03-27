import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { createClosingSchema } from '@/lib/validators/closing';
import { calculateWeeklyTotals } from '@/lib/services/closing';
import { logAudit } from '@/lib/services/audit';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO'];
const ALLOWED_ROLES_READ = ['ADMIN', 'FINANCEIRO', 'GESTOR'];

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES_READ);

    const closings = await prisma.weeklyClosing.findMany({
      orderBy: { weekStart: 'desc' },
    });

    const data = closings.map((c) => ({
      ...c,
      openingBalance: toNumber(c.openingBalance),
      totalIncome: toNumber(c.totalIncome),
      totalExpenses: toNumber(c.totalExpenses),
      expectedBalance: toNumber(c.expectedBalance),
      actualBalance: toNumber(c.actualBalance),
      difference: toNumber(c.difference),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar fechamentos:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const body = await request.json();
    const parsed = createClosingSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const weekStart = new Date(parsed.data.weekStart);
    const weekEnd = new Date(parsed.data.weekEnd);
    const openingBalance = parsed.data.openingBalance;
    const actualBalance = parsed.data.actualBalance;

    // Calculate totals for the period
    const totals = await calculateWeeklyTotals(weekStart, weekEnd);

    const expectedBalance = openingBalance + totals.totalIncome - totals.totalExpenses;
    const difference = actualBalance - expectedBalance;

    const closing = await prisma.$transaction(async (tx) => {
      const newClosing = await tx.weeklyClosing.create({
        data: {
          weekStart,
          weekEnd,
          openingBalance,
          totalIncome: totals.totalIncome,
          totalExpenses: totals.totalExpenses,
          expectedBalance,
          actualBalance,
          difference,
          status: 'ABERTO',
          notes: parsed.data.notes,
        },
      });

      // Create entries
      for (const entry of totals.entries) {
        await tx.weeklyClosingEntry.create({
          data: {
            weeklyClosingId: newClosing.id,
            description: entry.description,
            type: entry.type,
            value: entry.value,
            category: entry.category,
            reference: entry.referenceId || null,
          },
        });
      }

      return newClosing;
    });

    await logAudit(session.userId, 'CREATE', 'WeeklyClosing', closing.id, null, closing);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...closing,
          openingBalance: toNumber(closing.openingBalance),
          totalIncome: toNumber(closing.totalIncome),
          totalExpenses: toNumber(closing.totalExpenses),
          expectedBalance: toNumber(closing.expectedBalance),
          actualBalance: toNumber(closing.actualBalance),
          difference: toNumber(closing.difference),
          entriesCount: totals.entries.length,
        },
        message: 'Fechamento semanal criado com sucesso',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao criar fechamento:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
