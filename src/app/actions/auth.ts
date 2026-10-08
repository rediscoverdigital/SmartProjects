'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createLoginSession, destroyLoginSession, verifyPassword, checkLoginThrottle, recordLoginFailure, resetLoginThrottle } from '@/lib/auth';

export async function loginAction(_prev: any, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  // Rate limit: max 10 attempts per IP+email per minute
  const ip = 'server'; // In production, extract from headers via NextRequest
  const throttle = checkLoginThrottle(ip, email);
  if (throttle.blocked) {
    return { error: `Too many attempts. Try again in ${throttle.retryAfter}s.` };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt to prevent timing-based user enumeration
  const dummyHash = '$2a$10$abcdefghijklmnopqrstuuVwXyZ0123456789ABCDEFGHIJKLMNOPQ';
  const hashToCheck = user?.passwordHash ?? dummyHash;
  const ok = await verifyPassword(password, hashToCheck);

  if (!user || !ok) {
    recordLoginFailure(ip, email);
    return { error: 'Invalid email or password.' };
  }

  if (user.status !== 'active') {
    recordLoginFailure(ip, email);
    return { error: 'Invalid email or password.' };
  }

  // Check restaurant status — suspended tenants cannot log in
  if (user.restaurantId) {
    const resto = await prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
      select: { status: true },
    });
    if (!resto || resto.status !== 'active') {
      return { error: 'This restaurant is suspended. Contact support.' };
    }
  }

  resetLoginThrottle(ip, email);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createLoginSession(user.id);

  redirect(user.role === 'super_admin' ? '/admin' : '/dashboard');
}

export async function logoutAction() {
  destroyLoginSession();
  redirect('/login');
}

// ── PASSWORD RESET (user-facing) ────────────────────────────

/** Validate a reset token without consuming it (used by the reset page). */
export async function checkResetToken(token: string) {
  const { findUserByResetToken } = await import('@/lib/auth');
  const user = await findUserByResetToken(token);
  if (!user) return { valid: false as const };
  return { valid: true as const, name: user.name, email: user.email };
}

/** Set a new password using a valid reset token, then invalidate the token. */
export async function completePasswordReset(_prev: any, formData: FormData) {
  const token = String(formData.get('token') || '');
  const password = String(formData.get('password') || '');
  const confirm = String(formData.get('confirm') || '');

  if (!token) return { error: 'Missing reset token.' };
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' };
  if (password !== confirm) return { error: 'Passwords do not match.' };

  const { findUserByResetToken, hashPassword } = await import('@/lib/auth');
  const user = await findUserByResetToken(token);
  if (!user) return { error: 'This reset link is invalid or has expired. Ask your admin for a new one.' };

  const hash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      // single-use: clear the token so it cannot be replayed
      passwordResetToken: null,
      passwordResetExpiry: null,
      status: 'active',
      // Invalidate all existing sessions for this user
      sessionVersion: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      restaurantId: user.restaurantId ?? undefined,
      actorId: user.id,
      actorEmail: user.email,
      action: 'user.password_reset_completed',
      entityType: 'User',
      entityId: user.id,
    },
  }).catch(() => {});

  redirect('/login?reset=1');
}
