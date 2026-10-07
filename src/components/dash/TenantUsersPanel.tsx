'use client';

import { useState, useTransition } from 'react';
import { resetUserPassword, updateUserStatus } from '@/app/actions/dashboard';
import { StatusPill } from '@/components/dash/ui';
import { Ban, Unlock, Key, Copy, CheckCircle, X, Loader2 } from 'lucide-react';

type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  restaurantName: string | null;
  restaurantSlug: string | null;
};

export function TenantUsersPanel({ users }: { users: TenantUser[] }) {
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reset, setReset] = useState<{ email: string; name: string; link: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doReset = (userId: string) => {
    setErr(null);
    setBusyId(userId);
    start(async () => {
      const fd = new FormData();
      fd.set('userId', userId);
      const res = await resetUserPassword(fd);
      setBusyId(null);
      if (res?.error) setErr(res.error);
      else if (res?.ok && res.resetPath) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        setReset({
          email: res.email || '',
          name: res.name || '',
          link: `${origin}${res.resetPath}`,
          expiresAt: res.expiresAt || '',
        });
      }
    });
  };

  const doToggle = (userId: string, nextStatus: string) => {
    setErr(null);
    setBusyId(userId);
    start(async () => {
      const res = await updateUserStatus(userId, nextStatus as 'active' | 'suspended');
      setBusyId(null);
      if (res?.error) setErr(res.error);
    });
  };

  const copyLink = () => {
    if (reset) {
      navigator.clipboard.writeText(reset.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const expiresLabel = reset?.expiresAt
    ? new Date(reset.expiresAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <>
      {reset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setReset(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#4F5C46]" />
                <h3 className="font-display text-[1.1rem]">Reset link generated</h3>
              </div>
              <button onClick={() => setReset(null)} className="rounded-lg p-1 text-black/40 hover:bg-black/[0.05] hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[0.82rem] text-black/50">
              Send this one-time link to <span className="font-semibold text-black/70">{reset.email}</span>. They choose
              their own new password — you never see it. The link expires at {expiresLabel} and can be used once.
            </p>
            <div className="mt-4 rounded-xl border border-black/[0.08] bg-black/[0.02] p-3.5">
              <p className="break-all font-mono text-[0.75rem] text-black/70">{reset.link}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={copyLink}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0c0c0c] px-4 py-2.5 text-[0.82rem] font-semibold text-white"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy reset link'}
              </button>
              <a
                href={reset.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-[0.82rem] font-semibold"
              >
                Open
              </a>
              <button
                onClick={() => setReset(null)}
                className="rounded-full border border-black/10 px-4 py-2.5 text-[0.82rem] font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {err && (
        <p className="mx-5 mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-[0.82rem] text-red-700">{err}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[0.85rem]">
          <thead>
            <tr className="border-b border-black/[0.06] text-[0.66rem] uppercase tracking-wider text-black/40">
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Restaurant</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {users.map((u) => (
              <tr key={u.id} className="transition hover:bg-black/[0.02]">
                <td className="px-5 py-3.5">
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-[0.72rem] text-black/40">{u.email}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-[0.85rem]">{u.restaurantName || '—'}</p>
                  <p className="text-[0.72rem] text-black/40">/{u.restaurantSlug || '—'}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase ${
                    u.role === 'super_admin' ? 'bg-[#0c0c0c] text-white' :
                    u.role === 'owner' ? 'bg-[#8E7642]/10 text-[#8E7642]' :
                    'bg-[#4F5C46]/10 text-[#4F5C46]'
                  }`}>{u.role}</span>
                </td>
                <td className="px-5 py-3.5"><StatusPill status={u.status} /></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => doToggle(u.id, u.status === 'active' ? 'suspended' : 'active')}
                      disabled={pending && busyId === u.id}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[0.68rem] font-bold uppercase transition disabled:opacity-50 ${
                        u.status === 'active'
                          ? 'border-red-200 text-red-700 hover:bg-red-50'
                          : 'border-green-200 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      {pending && busyId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : u.status === 'active' ? <Ban className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      onClick={() => doReset(u.id)}
                      disabled={pending && busyId === u.id}
                      title="Generate a new random password"
                      className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase text-[#0c0c0c] transition hover:bg-black/[0.03] disabled:opacity-50"
                    >
                      {pending && busyId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />} Reset
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <p className="px-5 py-8 text-center text-[0.82rem] text-black/40">No tenant users found.</p>
      )}
    </>
  );
}
