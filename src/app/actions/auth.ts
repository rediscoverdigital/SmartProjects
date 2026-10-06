'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createLoginSession, destroyLoginSession, verifyPassword } from '@/lib/auth';

export async function loginAction(_prev: any, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'active') return { error: 'Invalid email or password.' };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: 'Invalid email or password.' };

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createLoginSession(user.id);

  redirect(user.role === 'super_admin' ? '/admin' : '/dashboard');
}

export async function logoutAction() {
  destroyLoginSession();
  redirect('/login');
}
