'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { completePasswordReset } from '@/app/actions/auth';
import { CheckCircle, Loader2, ShieldCheck } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brass-400 py-3.5 text-[0.9rem] font-bold text-[#0A0F16] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
      {pending ? 'Saving…' : 'Set new password'}
    </button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useFormState(completePasswordReset, null as any);

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-white/45">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[0.9rem] text-[#F4F1E8] outline-none transition placeholder:text-white/25 focus:border-brass-400"
        />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-xs font-semibold uppercase tracking-wider text-white/45">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Re-enter your new password"
          className="mt-1.5 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[0.9rem] text-[#F4F1E8] outline-none transition placeholder:text-white/25 focus:border-brass-400"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[0.82rem] text-red-300">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="flex items-start gap-2 text-[0.72rem] leading-relaxed text-white/35">
        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        This link works once and expires 1 hour after it was issued. After saving, sign in with your new password.
      </p>
    </form>
  );
}
