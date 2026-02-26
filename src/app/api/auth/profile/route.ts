import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { ApiError, handleApiError } from '@/lib/server/api-utils';

export async function GET() {
  try {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');
    const role = headersList.get('x-user-role');

    if (!userId || !role) {
      throw new ApiError(401, 'Unauthorized');
    }
    let user = null;

    if (role === 'ADMIN') {
      user = await prisma.admin.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      });
    } else if (role === 'TEACHER') {
      user = await prisma.teacher.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          address: true,
          createdAt: true,
        },
      });
    } else {
      throw new ApiError(403, 'Forbidden');
    }

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error, 'Profile error');
  }
}
