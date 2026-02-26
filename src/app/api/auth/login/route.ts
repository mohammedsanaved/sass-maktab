import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/token';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import { parseBody } from '@/lib/server/validation';
import { assertRateLimit } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await assertRateLimit(request, {
      keyPrefix: 'auth_login',
      limit: 10,
      windowSeconds: 60,
    });

    const { email, password } = await parseBody(request, loginSchema);

    type LoginUser = { id: string; email: string; password: string };
    let user: LoginUser | null = null;
    let role = '';

    // Check Admin table
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      user = admin;
      role = 'ADMIN';
    } else {
      // Check Teacher table
      const teacher = await prisma.teacher.findUnique({ where: { email } });
      if (teacher) {
        user = teacher;
        role = 'TEACHER';
      }
    }

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const accessToken = await signAccessToken({
      id: user.id,
      role,
      email: user.email,
    });

    const refreshToken = await signRefreshToken({
      id: user.id,
      role,
      email: user.email,
    });

    const cookieStore = await cookies();
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ accessToken });
  } catch (error) {
    return handleApiError(error, 'Login error');
  }
}
