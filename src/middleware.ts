import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ----------------------------------------------------
  // 1. API Route Protection (Auth)
  // ----------------------------------------------------
  if (pathname.startsWith('/api')) {
    // Define protected API routes
    const protectedRoutes = ['/api/auth/profile', '/api/settings', '/api/teachers', '/api/teacherswithclassdetails', '/api/students', '/api/payments'];
    const adminRoutes = ['/api/admin'];
    const teacherRoutes = ['/api/teacher'];
    const teacherWithClassDetailsRoutes = ['/api/teacherswithclassdetails'];
    const paymentsRoutes = ['/api/payments'];

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
    const isTeacherRoute = teacherRoutes.some((route) => pathname.startsWith(route));
    const isTeacherWithClassDetailsRoute = teacherWithClassDetailsRoutes.some((route) => pathname.startsWith(route));
    const isPaymentsRoute = paymentsRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute || isAdminRoute || isTeacherRoute || isTeacherWithClassDetailsRoute || isPaymentsRoute) {
      const authorization = request.headers.get('authorization');

      if (!authorization || !authorization.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const token = authorization.split(' ')[1];

      try {
        const payload = await verifyAccessToken(token);

        // RBAC: ADMIN role has unrestricted access to all dashboard APIs
        if (payload.role !== 'ADMIN') {
          if (isAdminRoute) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }

          if (isTeacherRoute && payload.role !== 'TEACHER') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        }

        // Add user info to headers for downstream use
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.id);
        requestHeaders.set('x-user-role', payload.role);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }
    
    // Allow public API routes to pass through
    return NextResponse.next();
  }

  // ----------------------------------------------------
  // 2. Page Route Localization (next-intl)
  // ----------------------------------------------------
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - /_next/static (static files)
  // - /_next/image (image optimization files)
  // - /favicon.ico (favicon file)
  // - /images (public images)
  matcher: [
    // Match API routes
    '/api/:path*',
    '/',
    '/(en|ar|ur)/:path*',
    // Match all other routes that should be handled by next-intl
    '/((?!_next/static|_next/image|favicon.ico|images|docs|.*\\..*).*)',
  ],
};
