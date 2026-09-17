import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'br_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Retrieve and validate ADMIN_SESSION_SECRET from environment.
 * In production, the application refuses to start without a sufficiently
 * long secret. A hardcoded fallback is intentionally NOT provided.
 */
function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'ADMIN_SESSION_SECRET environment variable is required. ' +
      'Set it to a random string of at least 32 characters.'
    );
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET must be at least 32 characters long in production.'
    );
  }
  return secret;
}

export interface AdminSessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  expiresAt: number;
}

/**
 * Sign session payload with HMAC-SHA256
 */
export function signSessionToken(data: AdminSessionData): string {
  const secret = getSessionSecret();
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Verify session token and return parsed payload.
 * Uses timing-safe comparison to prevent signature timing attacks.
 */
export function verifySessionToken(token: string): AdminSessionData | null {
  try {
    const secret = getSessionSecret();
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64url');

    // Timing-safe comparison
    const sigBuffer = Buffer.from(signature, 'base64url');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8')
    ) as AdminSessionData;

    if (Date.now() > data.expiresAt) {
      return null; // Expired
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Hash plain password with bcrypt
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 12);
}

/**
 * Compare plain password with bcrypt hash
 */
export async function comparePassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Get current admin session from server cookies
 */
export async function getAdminSession(): Promise<AdminSessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Create admin session cookie in response
 */
export async function setAdminSessionCookie(session: AdminSessionData) {
  const cookieStore = await cookies();
  const token = signSessionToken(session);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear admin session cookie
 */
export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
