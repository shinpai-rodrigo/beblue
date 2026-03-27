import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO', 'GESTOR'];

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const summary = searchParams.get('summary') === 'true';

    const where: any = { deletedAt: null };

    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (summary) {
      const allCommissions = await prisma.commission.findMany({
        where: { deletedAt: null },
        select: { calculatedValue: true, paidValue: true, status: true },
      });

      let totalCalculated = 0;
      let totalApproved = 0;
      let totalPaid = 0;

      for (const c of allCommissions) {
        const value = toNumber(c.calculatedValue);
        if (c.status === 'CALCULADA') totalCalculated += value;
        if (c.status === 'APROVADA') totalApproved += value;
        if (c.status === 'PAGA') totalPaid += toNumber(c.paidValue || c.calculatedValue);
      }

      return NextResponse.json({
        success: true,
        data: { totalCalculated, totalApproved, totalPaid },
      });
    }

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
          rule: { select: { id: true, description: true } },
        },
      }),
      prisma.commission.count({ where }),
    ]);

    const data = commissions.map((c) => ({
      ...c,
      basisValue: toNumber(c.basisValue),
      percentage: toNumber(c.percentage),
      calculatedValue: toNumber(c.calculatedValue),
      paidValue: c.paidValue ? toNumber(c.paidValue) : null,
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
    console.error('Erro ao listar comissões:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
