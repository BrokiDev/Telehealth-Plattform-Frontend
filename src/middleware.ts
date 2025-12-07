import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes and their required roles
const protectedRoutes = {
  '/dashboard': ['admin', 'provider', 'patient'],
  '/patients': ['admin', 'provider'],
  '/providers': ['admin'],
  '/visits': ['admin', 'provider', 'patient'],
  '/video': ['admin', 'provider', 'patient'],
} as const;

const publicRoutes = ['/auth/login', '/auth/register', '/', '/about'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the route is protected
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Here you would normally verify the JWT token and check roles
    // For now, we'll trust the token exists and continue
    // In a real implementation, you'd decode and verify the JWT
    
    try {
      // TODO: Implement JWT verification and role checking
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // const userRole = decoded.role;
      
      // Check if user has required role for this route
      // const requiredRoles = protectedRoutes[pathname as keyof typeof protectedRoutes];
      // if (requiredRoles && !requiredRoles.includes(userRole)) {
      //   return NextResponse.redirect(new URL('/unauthorized', request.url));
      // }
      
      return NextResponse.next();
    } catch (error) {
      // Invalid token, redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};