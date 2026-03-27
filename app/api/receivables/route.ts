import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { toNumber } from '@/lib/types';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO', 'COMERCIAL', 'GESTOR'];

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const overdue = searchParams.get('overdue');
    const summary = searchParams.get('summary') === 'true';

    const where: any = { deletedAt: null };

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    if (overdue === 'true') {
      where.status = 'PENDENTE';
      where.dueDate = { lt: new Date() };
    }

    if (summary) {
      const allReceivables = await prisma.receivable.findMany({
        where: { deletedAt: null },
        select: { value: true, receivedValue: true, status: true, dueDate: true },
      });

      let totalReceivable = 0;
      let totalReceived = 0;
      let totalOverdue = 0;

      for (const r of allReceivables) {
        const value = toNumber(r.value);
        if (r.status === 'RECEBIDO') {
          totalReceived += toNumber(r.receivedValue || r.value);
        } else if (r.status === 'PENDENTE') {
          totalReceivable += value;
          if (r.dueDate && r.dueDate < new Date()) {
            totalOverdue += value;
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          totalReceivable,
          totalReceived,
          totalOverdue,
        },
      });
    }

    const [receivables, total] = await Promise.all([
      prisma.receivable.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          campaign: { select: { id: true, name: true } },
          client: { select: { id: true, name: true } },
        },
      }),
      prisma.receivable.count({ where }),
    ]);

    const data = receivables.map((r) => ({
      ...r,
      value: toNumber(r.value),
      receivedValue: r.receivedValue ? toNumber(r.receivedValue) : null,
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
    console.error('Erro ao listar recebíveis:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
