import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import {
  ApiError,
  handleApiError,
} from '@/lib/server/api-utils';
import { registerUser } from '@/modules/auth/auth.service';
import { parseBody } from '@/lib/server/validation';
import { assertRateLimit } from '@/lib/rate-limit';

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

    const headersList = await headers();
    const userRole = headersList.get('x-user-role');

    if (userRole !== 'ADMIN') {
      throw new ApiError(403, 'Only admin users can register new users');
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
