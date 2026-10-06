'use client';

import { useState, useTransition } from 'react';
import { inviteStaff, setStaffStatus, setStaffPermissions } from '@/app/actions/dashboard';
import { StatusPill } from './ui';
import { Plus, Loader2, Shield, User, X, Ban, Check, ChevronDown, ChevronUp, Lock } from 'lucide-react';

type U = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  permissions: string | null;
};

const PERMISSION_DEFS: { key: string; label: string; desc: string }[] = [
  { key: 'canViewMenu', label: 'View menu', desc: 'See the menu in the dashboard' },
  { key: 'canEditMenu', label: 'Edit menu', desc: 'Add, edit, and delete menu items' },
  { key: 'canEditPrice', label: 'Change price', desc: 'Modify item prices' },
  { key: 'canEditAvailability', label: 'Change availability', desc: 'Toggle sold-out status' },
  { key: 'canManageTables', label: 'Manage tables & NFC/QR', desc: 'Create tables, generate QR codes, replace tags' },
  { key: 'canConfigureAi', label: 'Configure AI', desc: 'Edit AI welcome message, FAQs, and quota' },
  { key: 'canViewAnalytics', label: 'View analytics', desc: 'See dashboard analytics and reports' },
  { key: 'canResolveServiceRequests', label: 'Resolve service requests', desc: 'Acknowledge and resolve guest requests' },
  { key: 'canManageStaff', label: 'Manage staff', desc: 'Invite, suspend, and set permissions for staff' },
  { key: 'canManageBranding', label: 'Manage branding', desc: 'Edit colors, logo, and restaurant profile' },
];

function parsePermissions(raw: string | null): Record<string, boolean> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export function StaffManager({ users, currentUserId, canManage }: { users: U[]; currentUserId: string; canManage: boolean }) {
  const [showAdd, setShowAdd] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.5rem]">Staff accounts</h1>
          <p className="text-[0.82rem] text-black/45">Roles control what each person can see and change</p>
        </div>
        {canManage && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-4 py-2.5 text-[0.82rem] font-semibold text-white transition hover:bg-black">
            <Plus className="h-4 w-4" /> Add
          </button>
        )}
      </div>

      <div className="dash-card divide-y divide-black/[0.05] overflow-hidden">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          const isOwner = u.role === 'owner';
          const expanded = expandedId === u.id;
          const perms = parsePermissions(u.permissions);
          const activePerms = PERMISSION_DEFS.filter((p) => perms[p.key] !== false).length;

          return (
            <div key={u.id} className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0c0c0c] text-[0.8rem] font-bold text-white">
                  {u.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.88rem] font-semibold">
                    {u.name} {isSelf && <span className="text-[0.72rem] font-normal text-black/40">(you)</span>}
                  </p>
                  <p className="truncate text-[0.75rem] text-black/45">{u.email}</p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-black/[0.05] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-black/60">
                  {isOwner ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {u.role}
                </span>
                <span className="hidden text-[0.72rem] text-black/40 sm:block">
                  {u.lastLoginAt ? `last seen ${ago(u.lastLoginAt)}` : 'never signed in'}
                </span>
                <StatusPill status={u.status} />
                {canManage && !isSelf && (
                  <button
                    onClick={() => start(async () => { await setStaffStatus(u.id, u.status); })}
                    disabled={pending}
                    className={`rounded-lg p-2 transition ${u.status === 'active' ? 'text-black/40 hover:bg-red-50 hover:text-red-600' : 'text-[#4F5C46] hover:bg-black/[0.05]'}`}
                    title={u.status === 'active' ? 'Suspend access' : 'Reactivate'}
                  >
                    {u.status === 'active' ? <Ban className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  </button>
                )}
                {canManage && !isOwner && !isSelf && (
                  <button
                    onClick={() => setExpandedId(expanded ? null : u.id)}
                    className="rounded-lg p-2 text-black/40 transition hover:bg-black/[0.05] hover:text-black/70"
                    title="Toggle permissions"
                  >
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>

              {/* Permission matrix */}
              {expanded && canManage && !isOwner && !isSelf && (
                <form
                  action={(fd) => start(async () => {
                    fd.append('userId', u.id);
                    const res = await setStaffPermissions(fd);
                    if (res?.error) setErr(res.error);
                  })}
                  className="mt-3 rounded-xl border border-black/[0.06] bg-black/[0.02] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-black/45">
                      Permissions · {activePerms}/{PERMISSION_DEFS.length} enabled
                    </p>
                    <span className="text-[0.68rem] text-black/35">Uncheck to restrict</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PERMISSION_DEFS.map((p) => {
                      const enabled = perms[p.key] !== false;
                      return (
                        <label key={p.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/[0.05] bg-white px-3 py-2.5 transition hover:border-black/15">
                          <input type="checkbox" name={p.key} defaultChecked={enabled} className="h-4 w-4 accent-[#0c0c0c]" />
                          <div className="min-w-0">
                            <p className="text-[0.8rem] font-medium">{p.label}</p>
                            <p className="truncate text-[0.68rem] text-black/40">{p.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-5 py-2 text-[0.78rem] font-semibold text-white disabled:opacity-60">
                      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save permissions
                    </button>
                  </div>
                  {err && <p className="mt-2 rounded-lg bg-red-50 px-3.5 py-2 text-[0.78rem] text-red-700">{err}</p>}
                </form>
              )}

              {/* Owner: locked */}
              {isOwner && (
                <div className="mt-2 flex items-center gap-2 text-[0.72rem] text-black/35">
                  <Lock className="h-3 w-3" /> Owner permissions cannot be restricted
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <form
            action={(fd) => start(async () => {
              const res = await inviteStaff(fd);
              if (res?.error) setErr(res.error); else setShowAdd(false);
            })}
            className="relative z-10 w-full max-w-[420px] rounded-2xl bg-[#f6f5f1] p-6 anim-pop"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[1.2rem]">Add staff member</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg p-1.5 hover:bg-black/[0.05]"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wide text-black/45">Name</span>
                <input name="name" required className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wide text-black/45">Email</span>
                <input name="email" type="email" required className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wide text-black/45">Role</span>
                <select name="role" className={inputCls}>
                  <option value="staff">Staff — operational access</option>
                  <option value="owner">Owner — full access</option>
                </select>
              </label>
              <p className="rounded-xl bg-black/[0.03] px-3.5 py-3 text-[0.75rem] text-black/50">
                In the pilot, the default password is <span className="font-mono font-semibold">demo</span>.
              </p>
              {err && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[0.82rem] text-red-700">{err}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-full border border-black/10 px-5 py-2.5 text-[0.85rem] font-semibold">Cancel</button>
              <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-6 py-2.5 text-[0.85rem] font-semibold text-white">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} Add member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition focus:border-black/30';
function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}
