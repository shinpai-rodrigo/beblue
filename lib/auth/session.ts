import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';

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

  return session;
}

export async function requireRole(request: NextRequest, roles: string[]): Promise<JWTPayload> {
  const session = await requireAuth(request);

  if (!roles.includes(session.role)) {
    throw new AuthError('Acesso negado. Você não tem permissão para realizar esta ação.', 403);
  }

  return session;
}
