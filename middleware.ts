import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  
  // Public routes that don't require authentication
  const publicPaths = ['/auth/login', '/auth/register'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Guest routes (don't require auth)
  const isGuestPath = pathname.startsWith('/guest');
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/patients', '/providers', '/visits', '/video'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // If on auth page and already logged in, redirect to dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If on protected route without token, redirect to login
  if (isProtectedPath && !token) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
