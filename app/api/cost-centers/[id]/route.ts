import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { logAudit } from '@/lib/services/audit';
import { z } from 'zod';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO'];

const updateCostCenterSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const costCenter = await prisma.costCenter.findFirst({
      where: { id, deletedAt: null },
    });

    if (!costCenter) {
      return NextResponse.json({ success: false, error: 'Centro de custo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: costCenter });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao buscar centro de custo:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateCostCenterSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.costCenter.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Centro de custo não encontrado' }, { status: 404 });
    }

    const costCenter = await prisma.costCenter.update({ where: { id }, data: parsed.data });

    await logAudit(session.userId, 'UPDATE', 'CostCenter', id, existing, costCenter);

    return NextResponse.json({ success: true, data: costCenter, message: 'Centro de custo atualizado com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar centro de custo:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const existing = await prisma.costCenter.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Centro de custo não encontrado' }, { status: 404 });
    }

    await prisma.costCenter.update({ where: { id }, data: { deletedAt: new Date() } });

    await logAudit(session.userId, 'DELETE', 'CostCenter', id, existing, null);

    return NextResponse.json({ success: true, message: 'Centro de custo removido com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao remover centro de custo:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
