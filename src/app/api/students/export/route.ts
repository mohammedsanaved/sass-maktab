import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  handleApiError,
  observeApiDurationMs,
  recordApiSuccess,
} from '@/lib/server/api-utils';
import { parseQuery } from '@/lib/server/validation';
import { assertRateLimit } from '@/lib/rate-limit';
import { generateStudentsCsv } from '@/modules/students-export/students-export.service';
import { enqueueJob } from '@/lib/queue/queue';
import { ensureWorkersRegistered } from '@/workers/register-workers';
import { STUDENTS_EXPORT_JOB_TYPE } from '@/workers/job-types';

const exportQuerySchema = z.object({
  mode: z.enum(['sync', 'async']).optional(),
});

export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
      const { mode } = parseQuery(request, exportQuerySchema);
      const normalizedMode = mode ?? 'sync';

      if (normalizedMode === 'async') {
        await assertRateLimit(request, {
          keyPrefix: 'students_export_async',
          limit: 5,
          windowSeconds: 60,
        });

        await ensureWorkersRegistered();
        const job = await enqueueJob(STUDENTS_EXPORT_JOB_TYPE, {
          requestedAt: new Date().toISOString(),
        });

        recordApiSuccess(200, { route: '/api/students/export', method: 'GET', mode: 'async' });
        observeApiDurationMs(Date.now() - startedAt, {
          route: '/api/students/export',
          method: 'GET',
          mode: 'async',
        });
        return NextResponse.json({
          success: true,
          data: {
            jobId: job.id,
            status: job.status,
            statusUrl: `/api/jobs/${job.id}`,
            downloadUrl: `/api/jobs/${job.id}?download=1`,
          },
        });
      }

      await assertRateLimit(request, {
        keyPrefix: 'students_export_sync',
        limit: 10,
        windowSeconds: 60,
      });

      const csvContent = await generateStudentsCsv();

      recordApiSuccess(200, { route: '/api/students/export', method: 'GET', mode: 'sync' });
      observeApiDurationMs(Date.now() - startedAt, {
        route: '/api/students/export',
        method: 'GET',
        mode: 'sync',
      });
      return new NextResponse(csvContent, {
          headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="students.csv"'
          }
      });

  } catch (error) {
    observeApiDurationMs(Date.now() - startedAt, {
      route: '/api/students/export',
      method: 'GET',
    });
    return handleApiError(error, 'Error exporting students');
  }
}
