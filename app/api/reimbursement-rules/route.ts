import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { logAudit } from '@/lib/services/audit';
import { z } from 'zod';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN'];

const createRuleSchema = z.object({
  category: z.string({ required_error: 'Categoria é obrigatória' }).min(1),
  description: z.string().optional().nullable(),
  maxValuePerDay: z.number({ required_error: 'Valor máximo por dia é obrigatório' }).nonnegative(),
  requiresReceipt: z.boolean().default(true),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);

    const rules = await prisma.reimbursementRule.findMany({
      orderBy: { category: 'asc' },
    });

    const data = rules.map((r) => ({
      ...r,
      maxValuePerDay: toNumber(r.maxValuePerDay),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar regras de reembolso:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const body = await request.json();
    const parsed = createRuleSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const rule = await prisma.reimbursementRule.create({
      data: parsed.data,
    });

    await logAudit(session.userId, 'CREATE', 'ReimbursementRule', rule.id, null, rule);

    return NextResponse.json(
      { success: true, data: rule, message: 'Regra de reembolso criada com sucesso' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao criar regra de reembolso:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
