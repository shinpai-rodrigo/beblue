import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth/session';
import { createReimbursementSchema } from '@/lib/validators/reimbursement';
import { applyReimbursementRules } from '@/lib/services/reimbursement';
import { logAudit } from '@/lib/services/audit';
import { toNumber } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const employeeId = searchParams.get('employeeId');
    const campaignId = searchParams.get('campaignId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { deletedAt: null };

    // Non-admin/financeiro can only see their own
    if (!['ADMIN', 'FINANCEIRO'].includes(session.role)) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { employeeId: true },
      });
      if (user?.employeeId) {
        where.employeeId = user.employeeId;
      }
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (campaignId) where.campaignId = campaignId;
    if (status) where.status = status;
    if (category) where.category = category;

    if (startDate || endDate) {
      where.receiptDate = {};
      if (startDate) where.receiptDate.gte = new Date(startDate);
      if (endDate) where.receiptDate.lte = new Date(endDate);
    }

    const [reimbursements, total] = await Promise.all([
      prisma.reimbursement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
      }),
      prisma.reimbursement.count({ where }),
    ]);

    const data = reimbursements.map((r) => ({
      ...r,
      requestedValue: toNumber(r.requestedValue),
      approvedValue: r.approvedValue ? toNumber(r.approvedValue) : null,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar reembolsos:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const parsed = createReimbursementSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const { receiptDate, ...rest } = parsed.data;

    // Apply reimbursement rules
    const ruleResult = await applyReimbursementRules(rest.category, rest.requestedValue);

    const reimbursement = await prisma.reimbursement.create({
      data: {
        ...rest,
        approvedValue: ruleResult.approvedValue,
        status: ruleResult.isPartial ? 'APROVADO_PARCIAL' : 'ENVIADO',
        receiptDate: receiptDate ? new Date(receiptDate) : null,
      },
      include: {
        employee: { select: { id: true, name: true } },
      },
    });

    await logAudit(session.userId, 'CREATE', 'Reimbursement', reimbursement.id, null, reimbursement);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...reimbursement,
          requestedValue: toNumber(reimbursement.requestedValue),
          approvedValue: reimbursement.approvedValue ? toNumber(reimbursement.approvedValue) : null,
        },
        message: ruleResult.isPartial
          ? `Reembolso criado com aprovação parcial (R$ ${ruleResult.approvedValue.toFixed(2)})`
          : 'Reembolso criado com sucesso',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao criar reembolso:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
