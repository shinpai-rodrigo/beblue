import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { logAudit } from '@/lib/services/audit';
import { z } from 'zod';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO'];

const createCostCenterSchema = z.object({
  name: z.string({ required_error: 'Nome é obrigatório' }).min(2, 'Nome deve ter pelo menos 2 caracteres'),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = { deletedAt: null };
    if (activeOnly) {
      where.active = true;
    }

    const costCenters = await prisma.costCenter.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: costCenters });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar centros de custo:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const body = await request.json();
    const parsed = createCostCenterSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const costCenter = await prisma.costCenter.create({
      data: parsed.data,
    });

    await logAudit(session.userId, 'CREATE', 'CostCenter', costCenter.id, null, costCenter);

    return NextResponse.json(
      { success: true, data: costCenter, message: 'Centro de custo criado com sucesso' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao criar centro de custo:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
