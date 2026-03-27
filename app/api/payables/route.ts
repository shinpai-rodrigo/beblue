import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO'];

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    // Influencer payments pending
    const pendingInfluencers = await prisma.campaignInfluencer.findMany({
      where: {
        deletedAt: null,
        openValue: { gt: 0 },
        status: { in: ['PENDENTE', 'PARCIAL'] },
      },
      include: {
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const influencerPayables = pendingInfluencers.map((inf) => ({
      id: inf.id,
      type: 'INFLUENCIADOR' as const,
      description: `${inf.name} - ${inf.campaign?.name || ''}`,
      value: toNumber(inf.openValue),
      dueDate: inf.dueDate,
      status: inf.status,
      campaignId: inf.campaignId,
      campaignName: inf.campaign?.name,
      socialHandle: inf.socialHandle,
    }));

    // Approved commissions
    const pendingCommissions = await prisma.commission.findMany({
      where: {
        deletedAt: null,
        status: { in: ['CALCULADA', 'APROVADA'] },
      },
      include: {
        employee: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
      },
    });

    const commissionPayables = pendingCommissions.map((c) => ({
      id: c.id,
      type: 'COMISSAO' as const,
      description: `Comissão ${c.role} - ${c.employee.name} (${c.campaign?.name || ''})`,
      value: toNumber(c.calculatedValue),
      dueDate: null,
      status: c.status,
      campaignId: c.campaignId,
      campaignName: c.campaign?.name,
      employeeName: c.employee.name,
    }));

    // Approved reimbursements
    const pendingReimbursements = await prisma.reimbursement.findMany({
      where: {
        deletedAt: null,
        status: { in: ['APROVADO', 'APROVADO_PARCIAL'] },
      },
      include: {
        employee: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
      },
    });

    const reimbursementPayables = pendingReimbursements.map((r) => ({
      id: r.id,
      type: 'REEMBOLSO' as const,
      description: `Reembolso ${r.category} - ${r.employee.name}`,
      value: toNumber(r.approvedValue || r.requestedValue),
      dueDate: null,
      status: r.status,
      campaignId: r.campaignId,
      campaignName: r.campaign?.name,
      employeeName: r.employee.name,
    }));

    const allPayables = [
      ...influencerPayables,
      ...commissionPayables,
      ...reimbursementPayables,
    ];

    const totalValue = allPayables.reduce((sum, p) => sum + p.value, 0);
    const totalItems = allPayables.length;

    // Paginate
    const start = (page - 1) * limit;
    const paginatedData = allPayables.slice(start, start + limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      summary: {
        totalValue,
        totalItems,
        totalInfluencers: influencerPayables.reduce((s, p) => s + p.value, 0),
        totalCommissions: commissionPayables.reduce((s, p) => s + p.value, 0),
        totalReimbursements: reimbursementPayables.reduce((s, p) => s + p.value, 0),
      },
      meta: {
        page,
        limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar contas a pagar:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
