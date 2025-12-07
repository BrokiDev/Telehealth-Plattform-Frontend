import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Skip middleware for static files, API routes, Next.js internals, and RSC requests
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    searchParams.has('_rsc') ||
    request.headers.get('rsc') === '1'
  ) {
    return NextResponse.next();
  }
  
  const token = request.cookies.get('auth_token')?.value;
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/patients', '/providers', '/visits'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // If accessing protected route without token, redirect to login
  if (isProtectedPath && !token) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // If accessing auth pages with valid token, redirect to dashboard
  if (pathname.startsWith('/auth') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
