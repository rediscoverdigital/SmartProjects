import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const COOKIE = 'sm_session';
const SECRET = process.env.AUTH_SECRET || 'dev-secret';

export type Role = 'super_admin' | 'owner' | 'staff';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  restaurantId: string | null;
};

// ── password hashing ──────────────────────────────────────
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// ── signed session token: base64(payload).hmac ────────────
export function signSession(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function readSession(token: string | undefined): { uid: string; exp: number } | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createLoginSession(userId: string) {
  const token = signSession({ uid: userId, exp: Date.now() + SESSION_MAX_AGE * 1000 });
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function destroyLoginSession() {
  cookies().delete(COOKIE);
}

/** Read the current dashboard user (server-side). */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = cookies().get(COOKIE)?.value;
  const sess = readSession(token);
  if (!sess) return null;
  const user = await prisma.user.findUnique({ where: { id: sess.uid } });
  if (!user || user.status !== 'active') return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    restaurantId: user.restaurantId,
  };
}

/**
 * Require an authenticated user, optionally scoped to a restaurant.
 * Enforces tenant isolation: a non-super-admin may only ever touch
 * their own restaurantId.
 */
export async function requireTenant(restaurantId?: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('Not authenticated', 401);
  if (user.role === 'super_admin') return user;
  if (!user.restaurantId) throw new AuthError('No restaurant bound', 403);
  if (restaurantId && restaurantId !== user.restaurantId) {
    throw new AuthError('Cross-tenant access denied', 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}
