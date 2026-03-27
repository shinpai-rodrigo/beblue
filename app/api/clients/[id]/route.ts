import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { updateClientSchema } from '@/lib/validators/client';
import { logAudit } from '@/lib/services/audit';

const ALLOWED_ROLES = ['ADMIN', 'FINANCEIRO', 'COMERCIAL'];
const ALLOWED_ROLES_READ = ['ADMIN', 'FINANCEIRO', 'COMERCIAL', 'GESTOR'];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES_READ);
    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { campaigns: true } },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json();
    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existing = await prisma.client.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    if (parsed.data.document && parsed.data.document !== existing.document) {
      const duplicate = await prisma.client.findFirst({
        where: { document: parsed.data.document, deletedAt: null, id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Já existe um cliente com este documento' },
          { status: 409 }
        );
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: parsed.data,
    });

    await logAudit(
      session.userId,
      'UPDATE',
      'Client',
      client.id,
      existing,
      client,
      request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({ success: true, data: client, message: 'Cliente atualizado com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { id } = await params;

    const existing = await prisma.client.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit(
      session.userId,
      'DELETE',
      'Client',
      client.id,
      existing,
      null,
      request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json({ success: true, message: 'Cliente removido com sucesso' });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao remover cliente:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
