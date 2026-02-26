import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { handleApiError } from '@/lib/server/api-utils';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('refreshToken');

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    return handleApiError(error, 'Logout error');
  }
}
