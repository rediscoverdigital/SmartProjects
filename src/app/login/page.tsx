'use client';

import { useState, Suspense } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { loginAction } from '@/app/actions/auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react';

const DEMO = [
  { email: 'leo.a@example.org', role: 'Super admin' },
  { email: 'grace.l@example.com', role: 'Côte Sauvage · owner' },
  { email: 'xena.w@example.org', role: 'Côte Sauvage · staff' },
  { email: 'wendy.h@example.net', role: 'Harbour & Co. · owner' },
  { email: 'fiona.g@example.net', role: 'Atelier · owner' },
];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function ResetBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('reset') !== '1') return null;
  return (
    <p className="mt-6 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-[0.82rem] text-emerald-300">
      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
      Your password has been updated. Sign in with your new password.
    </p>
  );
}

function LoginInner() {
  const [state, action] = useFormState(loginAction, null as any);
  const [email, setEmail] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0F16] px-5 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full opacity-[0.16] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #C0A86C 0%, transparent 70%)' }}
      />
      <div className="relative w-full max-w-[400px]">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brass-400/50">
            <span className="h-2.5 w-2.5 rounded-full bg-brass-400" />
          </span>
          <span className="font-display text-lg text-[#F4F1E8]">SmartMenus</span>
        </Link>

        <h1 className="mt-8 text-center font-display text-2xl text-[#F4F1E8]">Welcome back</h1>
        <p className="mt-2 text-center text-sm text-white/50">Sign in to your restaurant dashboard</p>

        <Suspense fallback={null}>
          <ResetBanner />
        </Suspense>

        <form action={action} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-white/45">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@restaurant.mu"
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[0.9rem] text-[#F4F1E8] outline-none transition placeholder:text-white/25 focus:border-brass-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-white/45">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••"
              className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[0.9rem] text-[#F4F1E8] outline-none transition placeholder:text-white/25 focus:border-brass-400"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[0.82rem] text-red-300">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-brass-400">
            Pilot accounts · password “demo”
          </p>
          <div className="mt-3 space-y-1">
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => setEmail(d.email)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.05]"
              >
                <span className="text-[0.8rem] text-[#F4F1E8]">{d.email}</span>
                <span className="text-[0.7rem] text-white/40">{d.role}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[0.75rem] text-white/35">
          <Link href="/" className="transition hover:text-white/60">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brass-400 py-3.5 text-[0.9rem] font-bold text-[#0A0F16] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? 'Signing in…' : 'Sign in'}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}
