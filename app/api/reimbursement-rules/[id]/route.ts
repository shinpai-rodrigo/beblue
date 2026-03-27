import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { logAudit } from '@/lib/services/audit';
import { z } from 'zod';

const ALLOWED_ROLES = ['ADMIN'];

const updateRuleSchema = z.object({
  category: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  maxValuePerDay: z.number().nonnegative().optional(),
  requiresReceipt: z.boolean().optional(),
  active: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateRuleSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.reimbursementRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Regra não encontrada' }, { status: 404 });
    }

    const rule = await prisma.reimbursementRule.update({
      where: { id },
      data: parsed.data,
    });

    await logAudit(session.userId, 'UPDATE', 'ReimbursementRule', id, existing, rule);

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

    const existing = await prisma.reimbursementRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Regra não encontrada' }, { status: 404 });
    }

    await prisma.reimbursementRule.delete({ where: { id } });

    await logAudit(session.userId, 'DELETE', 'ReimbursementRule', id, existing, null);

    return NextResponse.json({ success: true, message: 'Regra removida com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao remover regra:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
