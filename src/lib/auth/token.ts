import { SignJWT, jwtVerify } from 'jose';

function getRequiredSecret(name: 'ACCESS_TOKEN_SECRET' | 'REFRESH_TOKEN_SECRET') {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`[auth] Missing required environment variable: ${name}`);
  }

  return new TextEncoder().encode(value);
}

const ACCESS_TOKEN_SECRET = getRequiredSecret('ACCESS_TOKEN_SECRET');
const REFRESH_TOKEN_SECRET = getRequiredSecret('REFRESH_TOKEN_SECRET');

const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  id: string;
  role: string;
  email: string;
  [key: string]: unknown;
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
