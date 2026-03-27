import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { createReceivableSchema } from '@/lib/validators/receivable';
import { logAudit } from '@/lib/services/audit';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO', 'COMERCIAL'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({ where: { id, deletedAt: null } });
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campanha não encontrada' }, { status: 404 });
    }

    const receivables = await prisma.receivable.findMany({
      where: { campaignId: id, deletedAt: null },
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const data = receivables.map((r) => ({
      ...r,
      value: toNumber(r.value),
      receivedValue: r.receivedValue ? toNumber(r.receivedValue) : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar recebíveis:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json();
    const parsed = createReceivableSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campanha não encontrada' }, { status: 404 });
    }

    const { issueDate, dueDate, ...rest } = parsed.data;

    const receivable = await prisma.receivable.create({
      data: {
        ...rest,
        campaignId: id,
        clientId: rest.clientId || campaign.clientId,
        status: 'PENDENTE',
        issueDate: issueDate ? new Date(issueDate) : null,
        dueDate: new Date(dueDate),
      },
    });

    await logAudit(session.userId, 'CREATE', 'Receivable', receivable.id, null, receivable);

    return NextResponse.json(
      { success: true, data: receivable, message: 'Recebível criado com sucesso' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao criar recebível:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
