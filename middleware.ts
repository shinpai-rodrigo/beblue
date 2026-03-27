import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login'];
const PUBLIC_API_PATHS = ['/api/auth/login', '/api/health'];

const JWT_SECRET = process.env.JWT_SECRET || '';

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some(
    (p) => pathname === p || pathname === p + '/'
  );
}

async function verifyJwtSignature(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode and validate payload structure
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.userId || !payload.email) return false;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return false;

    // Verify HMAC-SHA256 signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureInput = encoder.encode(`${parts[0]}.${parts[1]}`);

    // Convert base64url signature to ArrayBuffer
    const signatureB64 = parts[2].replace(/-/g, '+').replace(/_/g, '/');
    const paddedB64 = signatureB64 + '='.repeat((4 - signatureB64.length % 4) % 4);
    const signatureBytes = Uint8Array.from(atob(paddedB64), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, signatureInput);
    return isValid;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('beblue-token')?.value;

  // Allow public API paths without auth (exact match)
  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  // API routes: return 401 if no token or invalid token
  if (pathname.startsWith('/api/')) {
    if (!token || !(await verifyJwtSignature(token))) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado. Faça login para continuar.' },
        { status: 401 }
      );
    }

    // CSRF protection for state-changing requests
    const method = request.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const origin = request.headers.get('origin');
      const appUrl = request.nextUrl.origin;

      if (origin) {
        // If Origin header is present, it MUST match the app origin
        if (origin !== appUrl) {
          return NextResponse.json(
            { success: false, error: 'Requisição rejeitada: origem não permitida.' },
            { status: 403 }
          );
        }
      } else {
        // No Origin header (same-origin API calls, curl, etc.)
        // Fallback: require JSON content-type or X-Requested-With header
        const contentType = request.headers.get('content-type') || '';
        const requestedWith = request.headers.get('x-requested-with');
        const hasJsonContentType = contentType.includes('application/json');
        const hasXRequestedWith = !!requestedWith;

        if (!hasJsonContentType && !hasXRequestedWith) {
          return NextResponse.json(
            { success: false, error: 'Requisição rejeitada: falha na verificação CSRF.' },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.next();
  }

  // Public pages
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Protected pages: redirect to /login if no token or invalid token
  if (!token || !(await verifyJwtSignature(token))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
