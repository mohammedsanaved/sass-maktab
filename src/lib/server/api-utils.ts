import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/lib/observability/logger';
import { incrementCounter, observeHistogram } from '@/lib/observability/metrics';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    message: string,
    codeOrDetails?: string | unknown,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code =
      typeof codeOrDetails === 'string'
        ? codeOrDetails
        : statusToDefaultCode(status);
    this.details =
      typeof codeOrDetails === 'string' ? details : codeOrDetails;
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, 'Invalid JSON payload');
  }
}

export function requireFields(
  payload: Record<string, unknown>,
  requiredFields: string[]
) {
  const missingFields = requiredFields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new ApiError(400, 'Missing required fields', { missingFields });
  }
}

export function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    incrementCounter('http_requests_total', {
      result: 'error',
      code: 'VALIDATION_ERROR',
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    incrementCounter('http_requests_total', {
      result: 'error',
      code: error.code,
      status: error.status,
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      { status: error.status }
    );
  }

  const prismaCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : undefined;

  if (prismaCode === 'P2002') {
    incrementCounter('http_requests_total', {
      result: 'error',
      code: 'CONFLICT',
      status: 409,
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Duplicate record violates a unique constraint',
        },
      },
      { status: 409 }
    );
  }

  if (prismaCode === 'P2025') {
    incrementCounter('http_requests_total', {
      result: 'error',
      code: 'NOT_FOUND',
      status: 404,
    });
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Requested record was not found',
        },
      },
      { status: 404 }
    );
  }

  logger.error(fallbackMessage, {
    error: error instanceof Error ? error.message : String(error),
  });
  incrementCounter('http_requests_total', {
    result: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    status: 500,
  });
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: fallbackMessage,
      },
    },
    { status: 500 }
  );
}

export function recordApiSuccess(
  status: number,
  labels?: Record<string, string | number>
) {
  incrementCounter('http_requests_total', {
    result: 'success',
    status,
    ...(labels || {}),
  });
}

export function observeApiDurationMs(
  durationMs: number,
  labels?: Record<string, string | number>
) {
  observeHistogram('http_duration_ms', durationMs, labels);
}

function statusToDefaultCode(status: number) {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 409) return 'CONFLICT';
  if (status >= 500) return 'INTERNAL_SERVER_ERROR';
  return 'API_ERROR';
}
