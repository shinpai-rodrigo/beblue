import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { updateReceivableSchema } from '@/lib/validators/receivable';
import { logAudit } from '@/lib/services/audit';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO', 'COMERCIAL'];

interface RouteParams {
  params: Promise<{ id: string; receivableId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id, receivableId } = await params;
    const body = await request.json();
    const parsed = updateReceivableSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.receivable.findFirst({
      where: { id: receivableId, campaignId: id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Recebível não encontrado nesta campanha' },
        { status: 404 }
      );
    }

    const { issueDate, dueDate, receivedDate, ...rest } = parsed.data;
    const updateData: any = { ...rest };

    if (issueDate !== undefined) updateData.issueDate = issueDate ? new Date(issueDate) : null;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (receivedDate !== undefined) updateData.receivedDate = receivedDate ? new Date(receivedDate) : null;

    const receivable = await prisma.receivable.update({
      where: { id: receivableId },
      data: updateData,
    });

    await logAudit(session.userId, 'UPDATE', 'Receivable', receivableId, existing, receivable);

    return NextResponse.json({ success: true, data: receivable, message: 'Recebível atualizado com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar recebível:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id, receivableId } = await params;

    const existing = await prisma.receivable.findFirst({
      where: { id: receivableId, campaignId: id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Recebível não encontrado nesta campanha' },
        { status: 404 }
      );
    }

    await prisma.receivable.update({
      where: { id: receivableId },
      data: { status: 'CANCELADA', deletedAt: new Date() },
    });

    await logAudit(session.userId, 'DELETE', 'Receivable', receivableId, existing, null);

    return NextResponse.json({ success: true, message: 'Recebível cancelado com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao cancelar recebível:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
