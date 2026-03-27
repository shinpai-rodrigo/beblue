import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';
import { prisma } from '@/lib/db';

const COOKIE_NAME = 'beblue-token';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

export async function getSession(request?: NextRequest): Promise<JWTPayload | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(COOKIE_NAME)?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  }

  if (!token) return null;

  return verifyToken(token);
}

export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  const session = await getSession(request);

  if (!session) {
    throw new AuthError('Não autenticado. Faça login para continuar.', 401);
  }

  // Verify user is still active in the database (session revocation check)
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { active: true },
  });

  if (!user || !user.active) {
    throw new AuthError('Conta desativada. Entre em contato com o administrador.', 401);
  }

  return session;
}

export async function requireRole(request: NextRequest, roles: string[]): Promise<JWTPayload> {
  const session = await requireAuth(request);

  // VULN-13: Revalidate role from database instead of trusting cached JWT
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, active: true },
  });

  if (!user || !user.active) {
    throw new AuthError('Conta desativada ou não encontrada.', 403);
  }

  if (!roles.includes(user.role)) {
    throw new AuthError('Acesso negado. Você não tem permissão para realizar esta ação.', 403);
  }

  // Update session with current role from DB
  session.role = user.role;

  return session;
}
