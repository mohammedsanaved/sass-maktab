import { z, type ZodTypeAny } from 'zod';
import { ApiError, readJson } from '@/lib/server/api-utils';

export type Parsed<T extends ZodTypeAny> = z.infer<T>;

export async function parseBody<T extends ZodTypeAny>(
  request: Request,
  schema: T
): Promise<Parsed<T>> {
  const payload = await readJson<unknown>(request);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError(
      400,
      'Request body validation failed',
      'VALIDATION_ERROR',
      parsed.error.flatten()
    );
  }

  return parsed.data;
}

export function parseQuery<T extends ZodTypeAny>(
  request: Request,
  schema: T
): Parsed<T> {
  const url = new URL(request.url);
  const rawQuery = searchParamsToObject(url.searchParams);
  const parsed = schema.safeParse(rawQuery);

  if (!parsed.success) {
    throw new ApiError(
      400,
      'Query validation failed',
      'VALIDATION_ERROR',
      parsed.error.flatten()
    );
  }

  return parsed.data;
}

export async function parseParams<T extends ZodTypeAny>(
  params: unknown | Promise<unknown>,
  schema: T
): Promise<Parsed<T>> {
  const resolved = await params;
  const parsed = schema.safeParse(resolved);

  if (!parsed.success) {
    throw new ApiError(
      400,
      'Route params validation failed',
      'VALIDATION_ERROR',
      parsed.error.flatten()
    );
  }

  return parsed.data;
}

function searchParamsToObject(searchParams: URLSearchParams) {
  const result: Record<string, string | string[]> = {};

  for (const key of new Set(Array.from(searchParams.keys()))) {
    const values = searchParams.getAll(key);
    result[key] = values.length > 1 ? values : (values[0] ?? '');
  }

  return result;
}
