import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE = 'cf_session';
const PROTECTED = ['/dashboard', '/book', '/patients'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(COOKIE)?.value);
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (pathname === '/login' && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*', '/book/:path*', '/patients/:path*', '/login'] };
