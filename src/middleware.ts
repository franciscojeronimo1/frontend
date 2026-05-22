import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/services/api';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (pathname === '/') {
    if (token && (await validateToken(token))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const isValid = await validateToken(token);
    if (!isValid) {
      const response = NextResponse.redirect(new URL('/', req.url));
      response.cookies.set(SESSION_COOKIE_NAME, '', {
        path: '/',
        maxAge: 0,
      });
      return response;
    }
  }

  return NextResponse.next();
}

async function validateToken(token: string) {
  if (!token) return false;

  try {
    await api.get('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
