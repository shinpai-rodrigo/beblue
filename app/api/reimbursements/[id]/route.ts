import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth/session';
import { updateReimbursementSchema } from '@/lib/validators/reimbursement';
import { logAudit } from '@/lib/services/audit';
import { toNumber } from '@/lib/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    const reimbursement = await prisma.reimbursement.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
      },
    });

    if (!reimbursement) {
      return NextResponse.json(
        { success: false, error: 'Reembolso não encontrado' },
        { status: 404 }
      );
    }

    // Non-admin/financeiro can only see their own
    if (!['ADMIN', 'FINANCEIRO'].includes(session.role)) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { employees: { select: { id: true }, take: 1 } },
      });
      const empId = user?.employees?.[0]?.id;
      if (empId !== reimbursement.employeeId) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...reimbursement,
        requestedValue: toNumber(reimbursement.requestedValue),
        approvedValue: reimbursement.approvedValue ? toNumber(reimbursement.approvedValue) : null,
      },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao buscar reembolso:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ['ADMIN', 'FINANCEIRO']);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateReimbursementSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.reimbursement.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Reembolso não encontrado' },
        { status: 404 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      ENVIADO: ['EM_ANALISE'],
      EM_ANALISE: ['APROVADO', 'APROVADO_PARCIAL', 'REJEITADO'],
      APROVADO: ['PAGO'],
      APROVADO_PARCIAL: ['PAGO'],
      REJEITADO: [],
      PAGO: [],
    };

    if (parsed.data.status && parsed.data.status !== existing.status) {
      const allowed = validTransitions[existing.status] || [];
      if (!allowed.includes(parsed.data.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Transição de status inválida: ${existing.status} -> ${parsed.data.status}`,
          },
          { status: 400 }
        );
      }
    }

    const { paidDate, ...rest } = parsed.data;
    const updateData: any = { ...rest };

    if (paidDate !== undefined) {
      updateData.paidDate = paidDate ? new Date(paidDate) : null;
    }

    // If marking as paid, set paidDate if not provided
    if (updateData.status === 'PAGO' && !updateData.paidDate) {
      updateData.paidDate = new Date();
    }

    const reimbursement = await prisma.reimbursement.update({
      where: { id },
      data: updateData,
      include: {
        employee: { select: { id: true, name: true } },
      },
    });

    await logAudit(session.userId, 'UPDATE', 'Reimbursement', id, existing, reimbursement);

    return NextResponse.json({
      success: true,
      data: {
        ...reimbursement,
        requestedValue: toNumber(reimbursement.requestedValue),
        approvedValue: reimbursement.approvedValue ? toNumber(reimbursement.approvedValue) : null,
      },
      message: 'Reembolso atualizado com sucesso',
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar reembolso:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ['ADMIN', 'FINANCEIRO']);
    const { id } = await params;

    const existing = await prisma.reimbursement.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Reembolso não encontrado' },
        { status: 404 }
      );
    }

    if (['PAGO'].includes(existing.status)) {
      return NextResponse.json(
        { success: false, error: 'Não é possível remover reembolso já pago' },
        { status: 400 }
      );
    }

    await prisma.reimbursement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit(session.userId, 'DELETE', 'Reimbursement', id, existing, null);

    return NextResponse.json({ success: true, message: 'Reembolso removido com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao remover reembolso:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
