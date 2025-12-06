import { SignJWT, jwtVerify } from 'jose';

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || 'default_access_secret_change_me');
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret_change_me');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
  [key: string]: any;
}

/**
 * Signs a new Access Token.
 * @param payload - The user data to embed in the token.
 * @returns The JWT string.
 */
export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_TOKEN_SECRET);
}

/**
 * Signs a new Refresh Token.
 * @param payload - The user data to embed in the token.
 * @returns The JWT string.
 */
export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_TOKEN_SECRET);
}

/**
 * Verifies an Access Token.
 * @param token - The JWT string.
 * @returns The decoded payload if valid, throws otherwise.
 */
export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
  return payload as TokenPayload;
}

/**
 * Verifies a Refresh Token.
 * @param token - The JWT string.
 * @returns The decoded payload if valid, throws otherwise.
 */
export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
  return payload as TokenPayload;
}
