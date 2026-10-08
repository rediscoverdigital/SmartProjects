import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const COOKIE = 'sm_session';

const SECRET = process.env.AUTH_SECRET;
if (!SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: AUTH_SECRET environment variable is required in production. ' +
      'Refusing to start with an insecure fallback session key.');
  }
  // Dev-only hard-coded fallback. In production, a missing key kills the process above.
  console.warn('⚠ AUTH_SECRET is not set — using dev-only fallback. Set AUTH_SECRET in production.');
}
const SESSION_SECRET = SECRET || 'dev-fallback-DO-NOT-USE-IN-PRODUCTION-9f3a7c2';

export type Role = 'super_admin' | 'owner' | 'staff';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  restaurantId: string | null;
  sessionVersion: number;
};

// ── password hashing ──────────────────────────────────────
export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// ── signed session token: base64(payload).hmac ────────────
// payload includes sessionVersion so we can invalidate stale sessions.
export function signSession(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function readSession(token: string | undefined): { uid: string; exp: number; sv: number } | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true },
  });
  const sv = user?.sessionVersion ?? 1;
  const token = signSession({ uid: userId, exp: Date.now() + SESSION_MAX_AGE * 1000, sv });
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
  const user = await prisma.user.findUnique({
    where: { id: sess.uid },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      restaurantId: true,
      status: true,
      sessionVersion: true,
    },
  });
  if (!user || user.status !== 'active') return null;
  // invalidate if session version changed (password reset, suspend, etc.)
  if (user.sessionVersion !== sess.sv) return null;

  // Suspended restaurants cannot be used.
  if (user.restaurantId) {
    const resto = await prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
      select: { status: true },
    });
    if (!resto || resto.status !== 'active') return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    restaurantId: user.restaurantId,
    sessionVersion: user.sessionVersion,
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

/**
 * Read a TV-view session from a public restaurant token.
 * TV links are read-only, tenant-scoped, and revocable by regenerating
 * the token in the dashboard. No password needed on the TV itself.
 */
export async function getTvSession(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  const restaurant = await prisma.restaurant.findFirst({
    where: { tvToken: token, status: 'active' },
  });
  if (!restaurant) return null;
  return {
    id: `tv:${restaurant.id}`,
    email: `${restaurant.slug}@tv`,
    name: restaurant.name,
    role: 'owner' as Role,
    restaurantId: restaurant.id,
    sessionVersion: 0,
  };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

// ── password reset tokens ──────────────────────────────────
// The raw token goes to the user (via reset link); only its SHA-256
// hash is stored, so a database leak cannot be replayed.

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): { token: string; tokenHash: string; expiry: Date } {
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  return { token, tokenHash, expiry };
}

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Look up a user by a raw reset token, enforcing expiry. */
export async function findUserByResetToken(token: string) {
  const tokenHash = hashResetToken(token);
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: tokenHash, passwordResetExpiry: { gt: new Date() } },
  });
  return user;
}

// ── login throttle ─────────────────────────────────────────
// Simple per-IP, per-username sliding-window to block brute force.
// In a multi-instance deployment this should be Redis; for the MVP
// an in-process Map is better than nothing.

const LOGIN_WINDOW_MS = 60_000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, number[]>();

export function checkLoginThrottle(ip: string, email: string): { blocked: boolean; retryAfter: number } {
  const key = `${ip}:${email}`;
  const now = Date.now();
  const attempts = (loginAttempts.get(key) ?? []).filter((t) => now - t < LOGIN_WINDOW_MS);
  if (attempts.length >= LOGIN_MAX_ATTEMPTS) {
    const oldest = Math.min(...attempts);
    const retryAfter = Math.max(0, LOGIN_WINDOW_MS - (now - oldest));
    return { blocked: true, retryAfter: Math.ceil(retryAfter / 1000) };
  }
  return { blocked: false, retryAfter: 0 };
}

export function recordLoginFailure(ip: string, email: string) {
  const key = `${ip}:${email}`;
  const now = Date.now();
  const attempts = (loginAttempts.get(key) ?? []).filter((t) => now - t < LOGIN_WINDOW_MS);
  attempts.push(now);
  loginAttempts.set(key, attempts);
}

export function resetLoginThrottle(ip: string, email: string) {
  loginAttempts.delete(`${ip}:${email}`);
}

// ── permissions enforcement ─────────────────────────────────
const STAFF_DEFAULTS: Record<string, boolean> = {
  canViewMenu: true,
  canEditMenu: true,
  canEditPrice: true,
  canEditAvailability: true,
  canManageTables: true,
  canConfigureAi: true,
  canViewAnalytics: true,
  canResolveServiceRequests: true,
  canManageStaff: false,
  canManageBranding: true,
};

/** Check if a user is allowed to perform an action.
 *  super_admin and owner always have full access.
 *  staff are gated by their permission overrides.
 */
export async function can(user: AuthUser | null, capability: string): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'owner') return true;

  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: { permissions: true },
  });
  if (!u) return false;
  if (!u.permissions) return STAFF_DEFAULTS[capability] ?? false;

  try {
    const overrides = JSON.parse(u.permissions) as Record<string, boolean>;
    if (capability in overrides) return overrides[capability] === true;
    return STAFF_DEFAULTS[capability] ?? false;
  } catch {
    return STAFF_DEFAULTS[capability] ?? false;
  }
}
