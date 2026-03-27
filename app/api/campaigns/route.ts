import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { createCampaignSchema } from '@/lib/validators/campaign';
import { logAudit } from '@/lib/services/audit';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO', 'COMERCIAL', 'OPERACAO'];

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const executiveId = searchParams.get('executiveId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (executiveId) where.executiveId = executiveId;

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          executive: { select: { id: true, name: true } },
          operation: { select: { id: true, name: true } },
          costCenter: { select: { id: true, name: true } },
          influencers: {
            where: { deletedAt: null },
            select: { negotiatedValue: true },
          },
          reimbursements: {
            where: { deletedAt: null, status: { in: ['APROVADO', 'APROVADO_PARCIAL', 'PAGO'] } },
            select: { approvedValue: true },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    const data = campaigns.map((c) => {
      const soldValue = toNumber(c.soldValue);
      const totalInfluencers = c.influencers.reduce((s, i) => s + toNumber(i.negotiatedValue), 0);
      const totalReimbursements = c.reimbursements.reduce((s, r) => s + toNumber(r.approvedValue), 0);
      const margin = soldValue - totalInfluencers - totalReimbursements;
      const marginPercent = soldValue > 0 ? Math.round((margin / soldValue) * 10000) / 100 : 0;

      const { influencers, reimbursements, ...rest } = c;
      return {
        ...rest,
        soldValue,
        margin,
        marginPercent,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar campanhas:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const body = await request.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const { startDate, endDate, ...rest } = parsed.data;

    const campaign = await prisma.campaign.create({
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        client: { select: { id: true, name: true } },
        executive: { select: { id: true, name: true } },
        operation: { select: { id: true, name: true } },
      },
    });

    await logAudit(
      session.userId,
      'CREATE',
      'Campaign',
      campaign.id,
      null,
      campaign,
      request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json(
      { success: true, data: campaign, message: 'Campanha criada com sucesso' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao criar campanha:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
