import jwt from 'jsonwebtoken';

// Resolve JWT_SECRET lazily to avoid crashing at module-load time during build.
// The secret is required at runtime for signing/verifying tokens.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined. Application cannot start without it.');
  }
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { algorithm: 'HS256', expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as JWTPayload;
  } catch {
    return null;
  }
}
