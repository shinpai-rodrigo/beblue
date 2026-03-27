import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { logAudit } from '@/lib/services/audit';
import { z } from 'zod';

const ALLOWED_ROLES = ['ADMIN'];

const createUserSchema = z.object({
  name: z.string({ required_error: 'Nome é obrigatório' }).min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string({ required_error: 'E-mail é obrigatório' }).email('E-mail inválido'),
  password: z.string({ required_error: 'Senha é obrigatória' }).min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'FINANCEIRO', 'COMERCIAL', 'OPERACAO', 'VISUALIZADOR'], {
    errorMap: () => ({ message: 'Papel inválido' }),
  }),
  employeeId: z.string().uuid().optional().nullable(),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: any = { deletedAt: null };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          employeeId: true,
          createdAt: true,
          employee: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Já existe um usuário com este e-mail' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(parsed.data.password);

    const user = await prisma.user.create({
      data: {
        ...parsed.data,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        employeeId: true,
        createdAt: true,
      },
    });

    await logAudit(session.userId, 'CREATE', 'User', user.id, null, { ...user, password: '[REDACTED]' });

    return NextResponse.json(
      { success: true, data: user, message: 'Usuário criado com sucesso' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
