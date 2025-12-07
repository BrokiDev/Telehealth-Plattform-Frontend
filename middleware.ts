import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/patients', '/providers', '/visits'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // If accessing protected route without token, redirect to login (only once)
  if (isProtectedPath && !token) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // If accessing auth pages with valid token, redirect to dashboard (only once)
  if (pathname.startsWith('/auth') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Only run middleware on specific paths to avoid RSC requests
export const config = {
  matcher: [
    '/dashboard',
    '/patients/:path*',
    '/providers/:path*', 
    '/visits/:path*',
    '/auth/:path*',
  ],
};
