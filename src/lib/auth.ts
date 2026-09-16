import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'br_admin_session';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'blush_rose_super_secret_cookie_signing_token_2025';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Verify session token and return parsed payload
 */
export function verifySessionToken(token: string): AdminSessionData | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payload)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as AdminSessionData;
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
  return bcrypt.hash(plainText, 10);
}

/**
 * Compare plain password with bcrypt hash
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
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
