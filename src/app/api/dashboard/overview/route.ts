import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  handleApiError,
  observeApiDurationMs,
  recordApiSuccess,
} from '@/lib/server/api-utils';
import { parseQuery } from '@/lib/server/validation';
import { getDashboardOverview } from '@/modules/dashboard/dashboard.service';
import { assertRateLimit } from '@/lib/rate-limit';

const dashboardOverviewQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(0).max(11).optional(),
});

export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
    await assertRateLimit(request, {
      keyPrefix: 'dashboard_overview',
      limit: 120,
      windowSeconds: 60,
    });

    const { year: yearParam, month: monthParam } = parseQuery(
      request,
      dashboardOverviewQuerySchema
    );

    const now = new Date();
    const year = yearParam ?? now.getFullYear();
    const month = monthParam ?? now.getMonth();

    const overview = await getDashboardOverview(year, month);
    recordApiSuccess(200, { route: '/api/dashboard/overview', method: 'GET' });
    observeApiDurationMs(Date.now() - startedAt, {
      route: '/api/dashboard/overview',
      method: 'GET',
    });
    return NextResponse.json(overview);
  } catch (error) {
    observeApiDurationMs(Date.now() - startedAt, {
      route: '/api/dashboard/overview',
      method: 'GET',
    });
    return handleApiError(error, 'Error fetching dashboard overview');
  }
}
