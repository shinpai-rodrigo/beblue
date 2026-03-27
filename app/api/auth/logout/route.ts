import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const isSecure = process.env.NODE_ENV === 'production' ||
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.url.startsWith('https');

    // Invalidate server-side session
    const token = request.cookies.get('beblue-token')?.value;
    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      }).catch(() => {
        // Session may not exist, ignore
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });

    response.cookies.set('beblue-token', '', {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
