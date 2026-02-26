import { NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth/token';
import { cookies } from 'next/headers';
import { ApiError, handleApiError } from '@/lib/server/api-utils';
import { assertRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    await assertRateLimit(request, {
      keyPrefix: 'auth_refresh',
      limit: 30,
      windowSeconds: 60,
    });

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token not found');
    }

    const payload = await verifyRefreshToken(refreshToken);
    
    // Generate new access token
    const newAccessToken = await signAccessToken({
      id: payload.id,
      role: payload.role,
      email: payload.email,
    });

    return NextResponse.json({ accessToken: newAccessToken });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error, 'Refresh token error');
    }

    return handleApiError(
      new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN'),
      'Refresh token error'
    );
  }
}
