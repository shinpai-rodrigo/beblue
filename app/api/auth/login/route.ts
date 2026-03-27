import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validators/auth';
import { logError } from '@/lib/logger';

// Rate limiting: in-memory store (IP -> array of timestamps)
const loginAttempts = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_MAX_MAP_SIZE = 10000;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let lastCleanup = Date.now();

function cleanupRateLimits(): void {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [ip, attempts] of loginAttempts.entries()) {
    const recent = attempts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      loginAttempts.delete(ip);
    } else {
      loginAttempts.set(ip, recent);
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanupRateLimits();
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];

  // Filter out attempts outside the window
  const recentAttempts = attempts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  loginAttempts.set(ip, recentAttempts);

  return recentAttempts.length >= RATE_LIMIT_MAX_ATTEMPTS;
}

function recordAttempt(ip: string): void {
  // Enforce max Map size to prevent memory exhaustion
  if (loginAttempts.size >= RATE_LIMIT_MAX_MAP_SIZE) {
    // Evict the oldest entry
    const firstKey = loginAttempts.keys().next().value;
    if (firstKey) loginAttempts.delete(firstKey);
  }

  const now = Date.now();
  const attempts = loginAttempts.get(ip) || [];
  attempts.push(now);
  loginAttempts.set(ip, attempts);
}

export async function POST(request: NextRequest) {
  try {
    // NOTE: In production, nginx should overwrite X-Forwarded-For to prevent client spoofing
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    // Check rate limit
    if (isRateLimited(ip)) {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas de login. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return NextResponse.json(
        { success: false, error: errors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employees: {
          select: { id: true, name: true },
          take: 1,
        },
      },
    });

    if (!user || !user.active) {
      // Normalize timing - always run bcrypt even if user not found to prevent timing attacks
      await comparePassword(password, '$2a$12$dummyhashtopreventtimingattacks0000000000000000000000');
      recordAttempt(ip);
      console.warn(`[SECURITY] Failed login attempt for email: ${email.substring(0, 3)}***@${email.split('@')[1] || '***'} from IP: ${ip} - user not found or inactive`);
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      recordAttempt(ip);
      console.warn(`[SECURITY] Failed login attempt for email: ${email.substring(0, 3)}***@${email.split('@')[1] || '***'} from IP: ${ip} - invalid password`);
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }

    const employee = user.employees?.[0] || null;

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const isSecure = process.env.NODE_ENV === 'production' ||
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.url.startsWith('https');

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: employee?.id || null,
        employee,
      },
      message: 'Login realizado com sucesso',
    });

    response.cookies.set('beblue-token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours (matches JWT expiry)
    });

    return response;
  } catch (error: any) {
    logError('auth/login', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
