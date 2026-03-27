import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { generateCommissions } from '@/lib/services/commission';
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

    const commissions = await prisma.commission.findMany({
      where: { campaignId: id, deletedAt: null },
      include: {
        employee: { select: { id: true, name: true } },
        rule: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = commissions.map((c) => ({
      ...c,
      basisValue: toNumber(c.basisValue),
      percentage: toNumber(c.percentage),
      calculatedValue: toNumber(c.calculatedValue),
      paidValue: c.paidValue ? toNumber(c.paidValue) : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar comissões:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({ where: { id, deletedAt: null } });
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campanha não encontrada' }, { status: 404 });
    }

    const commissions = await generateCommissions(id);

    for (const commission of commissions) {
      await logAudit(session.userId, 'CREATE', 'Commission', commission.id, null, commission);
    }

    if (commissions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Nenhuma comissão nova gerada. Verifique se existem regras ativas e funcionários vinculados.',
      });
    }

    return NextResponse.json(
      { success: true, data: commissions, message: `${commissions.length} comissão(ões) gerada(s) com sucesso` },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao gerar comissões:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
