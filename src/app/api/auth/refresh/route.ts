import { NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth/token';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    
    // Generate new access token
    const newAccessToken = await signAccessToken({
      id: payload.id,
      role: payload.role,
      email: payload.email,
    });

    return NextResponse.json({ accessToken: newAccessToken });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
  }
}
