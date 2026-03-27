import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { createEmployeeSchema } from '@/lib/validators/employee';
import { hashPassword } from '@/lib/auth/password';
import { logAudit } from '@/lib/services/audit';

const ALLOWED_ROLES = ['ADMIN'];

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const active = searchParams.get('active');
    const department = searchParams.get('department');

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { document: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (active !== null && active !== undefined && active !== '') {
      where.active = active === 'true';
    }

    if (department) {
      where.department = department;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          user: {
            select: { id: true, email: true, role: true, active: true },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: employees,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Erro ao listar funcionários:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ALLOWED_ROLES);
    const body = await request.json();
    const parsed = createEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const { createUser, userEmail, userPassword, userRole, hireDate, ...employeeData } = parsed.data;

    const existingEmployee = await prisma.employee.findFirst({
      where: { document: employeeData.document, deletedAt: null },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Já existe um funcionário com este documento' },
        { status: 409 }
      );
    }

    const employee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          ...employeeData,
          hireDate: hireDate ? new Date(hireDate) : null,
        },
      });

      if (createUser && userEmail && userPassword && userRole) {
        const existingUser = await tx.user.findUnique({ where: { email: userEmail } });
        if (existingUser) {
          throw new Error('Já existe um usuário com este e-mail');
        }

        const hashedPassword = await hashPassword(userPassword);
        await tx.user.create({
          data: {
            name: emp.name,
            email: userEmail,
            password: hashedPassword,
            role: userRole,
            employeeId: emp.id,
          },
        });
      }

      return emp;
    });

    await logAudit(
      session.userId,
      'CREATE',
      'Employee',
      employee.id,
      null,
      employee,
      request.headers.get('x-forwarded-for') || undefined
    );

    return NextResponse.json(
      { success: true, data: employee, message: 'Funcionário criado com sucesso' },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    if (error.message?.includes('Já existe')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error('Erro ao criar funcionário:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
