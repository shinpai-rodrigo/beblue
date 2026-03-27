import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const checks: Record<string, any> = {};

  // Check 1: Environment vars
  checks.jwt_secret_set = !!process.env.JWT_SECRET;
  checks.database_url_set = !!process.env.DATABASE_URL;
  checks.node_env = process.env.NODE_ENV;

  // Check 2: Prisma
  try {
    const { prisma } = await import('@/lib/db');
    const userCount = await prisma.user.count();
    checks.prisma = 'ok';
    checks.user_count = userCount;
  } catch (e: any) {
    checks.prisma = `error: ${e.message}`;
  }

  // Check 3: bcrypt
  try {
    const { comparePassword } = await import('@/lib/auth/password');
    const result = await comparePassword('test', '$2a$12$dummyhashtopreventtimingattacks0000000000000000000000');
    checks.bcrypt = `ok (result: ${result})`;
  } catch (e: any) {
    checks.bcrypt = `error: ${e.message}`;
  }

  // Check 4: JWT
  try {
    const { signToken } = await import('@/lib/auth/jwt');
    const token = signToken({ userId: 'test', email: 'test@test.com', role: 'ADMIN', name: 'Test' });
    checks.jwt_sign = `ok (${token.substring(0, 20)}...)`;
  } catch (e: any) {
    checks.jwt_sign = `error: ${e.message}`;
  }

  return NextResponse.json(checks);
}
