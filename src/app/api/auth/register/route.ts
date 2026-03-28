import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import {
  ApiError,
  handleApiError,
} from '@/lib/server/api-utils';
import { registerUser, hasAnyAdmin } from '@/modules/auth/auth.service';
import { parseBody } from '@/lib/server/validation';
import { assertRateLimit } from '@/lib/rate-limit';
import { verifyAccessToken } from '@/lib/auth/token';

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['ADMIN', 'TEACHER']),
    name: z.string().min(1),
    phone: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === 'TEACHER') {
      if (!value.phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: 'Phone is required for teachers',
        });
      }
      if (!value.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['address'],
          message: 'Address is required for teachers',
        });
      }
    }
  });

export async function POST(request: Request) {
  try {
    await assertRateLimit(request, {
      keyPrefix: 'auth_register',
      limit: 20,
      windowSeconds: 60,
    });

    const hasAdmin = await hasAnyAdmin();

    if (hasAdmin) {
      const authHeader = request.headers.get('authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ApiError(401, 'Unauthorized');
      }

      const token = authHeader.split(' ')[1];

      try {
        const payload = await verifyAccessToken(token);

        if (payload.role !== 'ADMIN') {
          throw new ApiError(403, 'Forbidden');
        }
      } catch {
        throw new ApiError(401, 'Invalid token');
      }
    }

    const payload = await parseBody(request, registerSchema);

    const result = await registerUser({
      email: payload.email,
      password: payload.password,
      role: payload.role,
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Registration error');
  }
}
