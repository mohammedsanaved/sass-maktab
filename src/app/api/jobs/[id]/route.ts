import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ApiError,
  handleApiError,
  observeApiDurationMs,
  recordApiSuccess,
} from '@/lib/server/api-utils';
import { parseParams, parseQuery } from '@/lib/server/validation';
import { getJob } from '@/lib/queue/queue';
import { assertRateLimit } from '@/lib/rate-limit';

const routeParamsSchema = z.object({
  id: z.string().min(1),
});

const jobsQuerySchema = z.object({
  download: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startedAt = Date.now();
  try {
    await assertRateLimit(request, {
      keyPrefix: 'jobs_status',
      limit: 180,
      windowSeconds: 60,
    });

    const { id } = await parseParams(params, routeParamsSchema);
    const { download } = parseQuery(request, jobsQuerySchema);
    const job = getJob(id);

    if (!job) {
      throw new ApiError(404, 'Job not found');
    }

    if (download === '1' && job.status === 'completed' && job.result) {
      const result = job.result as {
        csvContent?: string;
        contentType?: string;
        fileName?: string;
      };

      if (result.csvContent) {
        recordApiSuccess(200, {
          route: '/api/jobs/[id]',
          method: 'GET',
          mode: 'download',
        });
        observeApiDurationMs(Date.now() - startedAt, {
          route: '/api/jobs/[id]',
          method: 'GET',
          mode: 'download',
        });
        return new NextResponse(result.csvContent, {
          headers: {
            'Content-Type': result.contentType || 'text/plain',
            'Content-Disposition': `attachment; filename="${result.fileName || 'export.csv'}"`,
          },
        });
      }
    }

    const response = NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      error: job.error,
    });
    recordApiSuccess(200, { route: '/api/jobs/[id]', method: 'GET' });
    observeApiDurationMs(Date.now() - startedAt, {
      route: '/api/jobs/[id]',
      method: 'GET',
    });
    return response;
  } catch (error) {
    observeApiDurationMs(Date.now() - startedAt, {
      route: '/api/jobs/[id]',
      method: 'GET',
    });
    return handleApiError(error, 'Error fetching job');
  }
}
