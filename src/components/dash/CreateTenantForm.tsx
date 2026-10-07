'use client';

import { useState, useTransition } from 'react';
import { createTenant } from '@/app/actions/dashboard';
import { SectionHeading } from '@/components/dash/ui';
import { Plus, Loader2, CheckCircle, Copy, ExternalLink, X } from 'lucide-react';

const inputCls = 'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition focus:border-black/30';
const labelCls = 'mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wide text-black/45';

export function CreateTenantForm() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{
    slug: string;
    ownerEmail: string;
    tempPassword: string;
    tableCode: string;
    guestUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const copyPassword = () => {
    if (result) {
      navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!open) {
    return (
      <div className="dash-card flex items-center justify-between p-5">
        <div>
          <SectionHeading title="Create new tenant" />
          <p className="mt-1 text-[0.78rem] text-black/45">
            Provision a new restaurant with an owner account, a starter table, and a trial subscription.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-5 py-2.5 text-[0.82rem] font-semibold text-white transition hover:bg-black"
        >
          <Plus className="h-4 w-4" /> New tenant
        </button>
      </div>
    );
  }

  return (
    <div className="dash-card p-5">
      <div className="flex items-center justify-between">
        <SectionHeading title="Create new tenant" />
        <button
          onClick={() => { setOpen(false); setErr(null); setResult(null); }}
          className="rounded-lg p-1.5 text-black/40 transition hover:bg-black/[0.05] hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form
        action={(fd) => start(async () => {
          setErr(null);
          setResult(null);
          const res = await createTenant(fd);
          if (res?.error) {
            setErr(res.error);
          } else if (res?.ok) {
            setResult({
              slug: res.slug,
              ownerEmail: res.ownerEmail,
              tempPassword: res.tempPassword,
              tableCode: res.tableCode,
              guestUrl: res.guestUrl,
            });
          }
        })}
        className="mt-4 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Restaurant name</span>
            <input name="name" required placeholder="e.g. Le Petit Bistrot" className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Slug</span>
            <input name="slug" required placeholder="le-petit-bistrot" className={inputCls} />
            <span className="mt-1 block text-[0.68rem] text-black/35">Lowercase letters, numbers, hyphens only</span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Owner name</span>
            <input name="ownerName" required placeholder="e.g. Marie Dupont" className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Owner email</span>
            <input name="ownerEmail" type="email" required placeholder="marie@example.com" className={inputCls} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Plan</span>
            <select name="plan" defaultValue="growth" className={inputCls}>
              <option value="starter">Starter — Rs 1,500/mo</option>
              <option value="growth">Growth — Rs 3,000/mo</option>
              <option value="pro">Pro — Rs 5,000–7,500/mo</option>
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Tagline (optional)</span>
            <input name="tagline" placeholder="A short description" className={inputCls} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Address (optional)</span>
            <input name="address" placeholder="123 Main Street, Port Louis" className={inputCls} />
          </label>
          <label className="block">
            <span className={labelCls}>Phone (optional)</span>
            <input name="phone" placeholder="+230 555 1234" className={inputCls} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Primary color</span>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white p-1.5">
              <input type="color" name="primaryColor" defaultValue="#0C1824" className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent" />
              <span className="font-mono text-[0.78rem] text-black/50">#0C1824</span>
            </div>
          </label>
          <label className="block">
            <span className={labelCls}>Accent color</span>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white p-1.5">
              <input type="color" name="accentColor" defaultValue="#C0A86C" className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent" />
              <span className="font-mono text-[0.78rem] text-black/50">#C0A86C</span>
            </div>
          </label>
        </div>

        {err && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[0.82rem] text-red-700">{err}</p>
        )}

        {result && (
          <div className="rounded-xl border border-[#4F5C46]/30 bg-[#4F5C46]/[0.06] p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#4F5C46]" />
              <p className="text-[0.85rem] font-semibold text-[#4F5C46]">Tenant created successfully</p>
            </div>
            <div className="mt-3 space-y-2 text-[0.8rem]">
              <p><span className="font-semibold">Restaurant:</span> /{result.slug}</p>
              <p><span className="font-semibold">Owner:</span> {result.ownerEmail}</p>
              <div className="flex items-center gap-2">
                <p><span className="font-semibold">Temp password:</span> <code className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[0.75rem]">{result.tempPassword}</code></p>
                <button type="button" onClick={copyPassword} className="rounded p-1 text-black/40 hover:text-black" title="Copy password">
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-[#4F5C46]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p><span className="font-semibold">Guest URL:</span> <code className="rounded bg-black/[0.05] px-1.5 py-0.5 font-mono text-[0.75rem]">{result.guestUrl}</code></p>
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={result.guestUrl}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0c0c0c] px-4 py-2 text-[0.78rem] font-semibold text-white"
              >
                <ExternalLink className="h-3 w-3" /> Open guest view
              </a>
              <button
                type="button"
                onClick={() => { setOpen(false); setErr(null); setResult(null); }}
                className="rounded-full border border-black/10 px-4 py-2 text-[0.78rem] font-semibold"
              >
                Create another
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => { setOpen(false); setErr(null); setResult(null); }}
            className="rounded-full border border-black/10 px-5 py-2.5 text-[0.85rem] font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-6 py-2.5 text-[0.85rem] font-semibold text-white disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create tenant
          </button>
        </div>
      </form>
    </div>
  );
}
