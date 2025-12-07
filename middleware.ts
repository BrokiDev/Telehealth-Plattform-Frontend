import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/patients', '/providers', '/visits', '/video'];
  
  // Check if current path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      // Redirect to login page
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/patients/:path*',
    '/providers/:path*',
    '/visits/:path*',
    '/video/:path*',
  ],
};
