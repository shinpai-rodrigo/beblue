import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { logAudit } from '@/lib/services/audit';
import { z } from 'zod';

const ALLOWED_ROLES = ['ADMIN'];

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email('E-mail inválido').optional(),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').optional(),
  role: z.enum(['ADMIN', 'FINANCEIRO', 'COMERCIAL', 'OPERACAO', 'VISUALIZADOR']).optional(),
  active: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        employees: { select: { id: true, name: true }, take: 1 },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    const updateData: any = { ...parsed.data };

    if (parsed.data.email && parsed.data.email !== existing.email) {
      const duplicate = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Já existe um usuário com este e-mail' },
          { status: 409 }
        );
      }
    }

    if (parsed.data.password) {
      updateData.password = await hashPassword(parsed.data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    await logAudit(session.userId, 'UPDATE', 'User', id, { ...existing, password: '[REDACTED]' }, user);

    return NextResponse.json({ success: true, data: user, message: 'Usuário atualizado com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    if (id === session.userId) {
      return NextResponse.json(
        { success: false, error: 'Você não pode remover seu próprio usuário' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });

    await logAudit(session.userId, 'DELETE', 'User', id, { ...existing, password: '[REDACTED]' }, null);

    return NextResponse.json({ success: true, message: 'Usuário removido com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao remover usuário:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
