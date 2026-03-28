import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token';
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { checkEdgeRateLimit, type EdgeRateLimitRule } from '@/lib/rate-limit-edge';
import { logger } from '@/lib/observability/logger';
import { incrementCounter } from '@/lib/observability/metrics';

const intlMiddleware = createMiddleware(routing);

const authenticatedApiPrefixes = [
  '/api/auth/profile',
  '/api/settings',
  '/api/teachers',
  '/api/teacherswithclassdetails',
  '/api/students',
  '/api/payments',
  '/api/dashboard',
  '/api/migration',
  '/api/jobs',
  '/api/metrics',
] as const;

const adminOnlyApiPrefixes = [
  '/api/migration',
  '/api/metrics',
] as const;

const edgeRateLimitRules: Array<{ prefix: string; rule: EdgeRateLimitRule }> = [
  { prefix: '/api/auth/login', rule: { limit: 10, windowSeconds: 60 } },
  { prefix: '/api/auth/refresh', rule: { limit: 30, windowSeconds: 60 } },
  { prefix: '/api/auth/register', rule: { limit: 20, windowSeconds: 60 } },
  { prefix: '/api/students/export', rule: { limit: 10, windowSeconds: 60 } },
  { prefix: '/api/jobs', rule: { limit: 120, windowSeconds: 60 } },
  { prefix: '/api/dashboard', rule: { limit: 120, windowSeconds: 60 } },
  { prefix: '/api', rule: { limit: 300, windowSeconds: 60 } },
];

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

function resolveEdgeRateLimit(pathname: string) {
  return edgeRateLimitRules.find((item) => pathname.startsWith(item.prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // ----------------------------------------------------
  // 1. API Route Protection (Auth)
  // ----------------------------------------------------
  if (pathname.startsWith('/api')) {
    const edgeLimit = resolveEdgeRateLimit(pathname);
    const clientIp = getClientIp(request);

    if (edgeLimit) {
      const key = `${edgeLimit.prefix}:${clientIp}`;
      const result = checkEdgeRateLimit(key, edgeLimit.rule);

      if (!result.allowed) {
        incrementCounter('http_rate_limited_total', {
          layer: 'middleware',
          route: edgeLimit.prefix,
        });
        logger.warn('Middleware rate limit exceeded', {
          requestId,
          path: pathname,
          ip: clientIp,
          route: edgeLimit.prefix,
        });

        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests',
              details: {
                retryAfterSeconds: result.retryAfterSeconds,
              },
            },
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(result.retryAfterSeconds),
              'x-request-id': requestId,
            },
          }
        );
      }
    }

    incrementCounter('http_requests_total', {
      layer: 'middleware',
      method: request.method,
      path: pathname.startsWith('/api/') ? pathname.split('/').slice(0, 3).join('/') : pathname,
    });

    const isProtectedRoute = authenticatedApiPrefixes.some((route) =>
      pathname.startsWith(route)
    );

    if (!isProtectedRoute) {
      // Allow public API routes to pass through
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    const authorization = request.headers.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      logger.warn('Unauthorized API request', {
        requestId,
        path: pathname,
        ip: clientIp,
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
          },
        },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    const token = authorization.split(' ')[1];

    try {
      const payload = await verifyAccessToken(token);
      const isAdminOnlyRoute = adminOnlyApiPrefixes.some((route) =>
        pathname.startsWith(route)
      );

      if (isAdminOnlyRoute && payload.role !== 'ADMIN') {
        logger.warn('Forbidden API request', {
          requestId,
          path: pathname,
          role: payload.role,
        });
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Forbidden',
            },
          },
          { status: 403, headers: { 'x-request-id': requestId } }
        );
      }

      // Add user info to headers for downstream use
      requestHeaders.set('x-user-id', payload.id);
      requestHeaders.set('x-user-role', payload.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      logger.warn('Invalid auth token', {
        requestId,
        path: pathname,
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token',
          },
        },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }
  }

  // ----------------------------------------------------
  // 2. Page Route Localization (next-intl)
  // ----------------------------------------------------
  const response = intlMiddleware(request);
  response.headers.set('x-request-id', requestId);
  return response;
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
