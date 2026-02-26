import { NextResponse } from 'next/server';
import { snapshotMetrics } from '@/lib/observability/metrics';
import {
  handleApiError,
  observeApiDurationMs,
  recordApiSuccess,
} from '@/lib/server/api-utils';
import { assertRateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
    await assertRateLimit(request, {
      keyPrefix: 'metrics_read',
      limit: 60,
      windowSeconds: 60,
    });

    const response = NextResponse.json({
      generatedAt: new Date().toISOString(),
      ...snapshotMetrics(),
    });
    recordApiSuccess(200, { route: '/api/metrics', method: 'GET' });
    observeApiDurationMs(Date.now() - startedAt, {
      route: '/api/metrics',
      method: 'GET',
    });
    return response;
  } catch (error) {
    observeApiDurationMs(Date.now() - startedAt, {
      route: '/api/metrics',
      method: 'GET',
    });
    return handleApiError(error, 'Error fetching metrics');
  }
}
