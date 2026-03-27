import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        employees: {
          select: {
            id: true,
            name: true,
            department: true,
          },
          take: 1,
        },
      },
    });

    if (!user || !user.active) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado ou inativo' },
        { status: 404 }
      );
    }

    const employee = user.employees?.[0] || null;
    const { employees, ...userData } = user;

    return NextResponse.json({ success: true, data: { ...userData, employeeId: employee?.id || null, employee } });
  } catch (error: any) {
    if (error.status) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
