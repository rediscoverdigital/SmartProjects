import Link from 'next/link';
import { checkResetToken } from '@/app/actions/auth';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({ params }: { params: { token: string } }) {
  const check = await checkResetToken(params.token);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A0F16] px-5 py-12">
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

        {check.valid ? (
          <>
            <h1 className="mt-8 text-center font-display text-2xl text-[#F4F1E8]">Set a new password</h1>
            <p className="mt-2 text-center text-sm text-white/50">
              Hi {check.name} — choose a new password for <span className="text-white/70">{check.email}</span>.
            </p>
            <ResetPasswordForm token={params.token} />
          </>
        ) : (
          <>
            <h1 className="mt-8 text-center font-display text-2xl text-[#F4F1E8]">Link expired</h1>
            <p className="mt-2 text-center text-sm text-white/50">
              This reset link is invalid or has expired. Reset links are valid for 1 hour and can only be used once.
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
              <p className="text-[0.82rem] text-white/55">
                Ask your platform admin to issue a new reset link from the admin panel.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-brass-400 px-5 py-3 text-[0.85rem] font-bold text-[#0A0F16] transition hover:brightness-105"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}

        <p className="mt-6 text-center text-[0.75rem] text-white/35">
          <Link href="/" className="transition hover:text-white/60">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
