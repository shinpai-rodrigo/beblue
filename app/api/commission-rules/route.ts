import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { commissionRuleSchema } from '@/lib/validators/commission';
import { logAudit } from '@/lib/services/audit';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN'];

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);

    const rules = await prisma.commissionRule.findMany({
      orderBy: [{ role: 'asc' }, { clientType: 'asc' }],
    });

    const data = rules.map((r) => ({
      ...r,
      percentage: toNumber(r.percentage),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar regras de comissão:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const body = await request.json();
    const parsed = commissionRuleSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const { validFrom, validUntil, ...rest } = parsed.data;

    const rule = await prisma.commissionRule.create({
      data: {
        ...rest,
        validFrom: new Date(validFrom),
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    await logAudit(session.userId, 'CREATE', 'CommissionRule', rule.id, null, rule);

    return NextResponse.json(
      { success: true, data: rule, message: 'Regra de comissão criada com sucesso' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao criar regra de comissão:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
