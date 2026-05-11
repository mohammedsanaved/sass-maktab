import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/token';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    let user: any = null;
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
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
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
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
