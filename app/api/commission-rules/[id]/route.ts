import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { commissionRuleSchema } from '@/lib/validators/commission';
import { logAudit } from '@/lib/services/audit';

const ALLOWED_ROLES = ['ADMIN'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json();
    const parsed = commissionRuleSchema.partial().safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.commissionRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Regra não encontrada' }, { status: 404 });
    }

    const { validFrom, validUntil, ...rest } = parsed.data;
    const updateData: any = { ...rest };
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null;

    const rule = await prisma.commissionRule.update({
      where: { id },
      data: updateData,
    });

    await logAudit(session.userId, 'UPDATE', 'CommissionRule', id, existing, rule);

    return NextResponse.json({ success: true, data: rule, message: 'Regra atualizada com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar regra:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const existing = await prisma.commissionRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Regra não encontrada' }, { status: 404 });
    }

    await prisma.commissionRule.delete({ where: { id } });

    await logAudit(session.userId, 'DELETE', 'CommissionRule', id, existing, null);

    return NextResponse.json({ success: true, message: 'Regra removida com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao remover regra:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
