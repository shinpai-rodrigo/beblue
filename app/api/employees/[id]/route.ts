import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { updateEmployeeSchema } from '@/lib/validators/employee';
import { logAudit } from '@/lib/services/audit';

const ALLOWED_ROLES = ['ADMIN'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const employee = await prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: { id: true, email: true, role: true, active: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao buscar funcionário:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.employee.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    const { hireDate, ...rest } = parsed.data;
    const updateData: any = { ...rest };
    if (hireDate !== undefined) {
      updateData.hireDate = hireDate ? new Date(hireDate) : null;
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    await logAudit(session.userId, 'UPDATE', 'Employee', id, existing, employee);

    return NextResponse.json({ success: true, data: employee, message: 'Funcionário atualizado com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar funcionário:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const existing = await prisma.employee.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });

    await logAudit(session.userId, 'DELETE', 'Employee', id, existing, null);

    return NextResponse.json({ success: true, message: 'Funcionário removido com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao remover funcionário:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
