'use client';

import { useTransition, useState, useEffect } from 'react';
import { resolveRequest } from '@/app/actions/dashboard';
import { StatusPill, Empty, SectionHeading } from './ui';
import { BellRing, Check, X, Loader2, Receipt, Droplets, Scissors, Utensils, Sparkles, Baby, MoreHorizontal } from 'lucide-react';

type Req = {
  id: string;
  kind: string;
  label: string;
  status: string;
  note: string | null;
  tableLabel: string;
  createdAt: string;
};

const ICONS: Record<string, any> = {
  call_staff: BellRing,
  bill: Receipt,
  water: Droplets,
  napkins: Scissors,
  cutlery: Utensils,
  condiments: Sparkles,
  high_chair: Baby,
  other: MoreHorizontal,
};

export function FloorBoard({ requests }: { requests: Req[] }) {
  const [, setTick] = useState(0);
  // refresh "time ago" labels without a full reload
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const open = requests.filter((r) => r.status === 'new' || r.status === 'acknowledged');
  const done = requests.filter((r) => r.status === 'resolved' || r.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[1.5rem]">Live floor</h1>
        <p className="text-[0.82rem] text-black/45">
          {open.length} open {open.length === 1 ? 'request' : 'requests'} · updates as guests tap
        </p>
      </div>

      {open.length === 0 ? (
        <div className="dash-card">
          <Empty icon={BellRing} title="All clear" body="No open service requests right now. New requests appear here instantly." />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {open.map((r) => (
            <RequestCard key={r.id} req={r} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div>
          <SectionHeading title="Recently closed" />
          <div className="dash-card divide-y divide-black/[0.05]">
            {done.slice(0, 12).map((r) => {
              const Icon = ICONS[r.kind] || MoreHorizontal;
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 opacity-70">
                  <Icon className="h-4 w-4 text-black/35" />
                  <span className="text-[0.85rem] font-semibold">{r.tableLabel}</span>
                  <span className="text-[0.82rem] capitalize text-black/50">{r.label}</span>
                  <span className="ml-auto text-[0.7rem] text-black/35">{ago(r.createdAt)}</span>
                  <StatusPill status={r.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RequestCard({ req }: { req: Req }) {
  const [pending, start] = useTransition();
  const Icon = ICONS[req.kind] || MoreHorizontal;
  const isNew = req.status === 'new';

  return (
    <div className={`dash-card p-4 ${isNew ? 'ring-2 ring-[#C25E1E]/25' : ''}`}>
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/[0.05]">
          <Icon className="h-5 w-5 text-[#C25E1E]" />
        </span>
        <div className="text-right">
          <p className="text-[0.7rem] text-black/40">{ago(req.createdAt)}</p>
          <div className="mt-1"><StatusPill status={req.status} /></div>
        </div>
      </div>
      <p className="mt-3 font-display text-[1.2rem]">{req.tableLabel}</p>
      <p className="text-[0.85rem] capitalize text-black/55">{req.label}</p>
      {req.note && <p className="mt-1.5 text-[0.78rem] italic text-black/45">“{req.note}”</p>}

      <div className="mt-4 flex gap-2">
        {isNew && (
          <button
            onClick={() => start(async () => { await resolveRequest(req.id, 'acknowledged'); })}
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white py-2.5 text-[0.8rem] font-semibold transition hover:border-black/25 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Acknowledge
          </button>
        )}
        <button
          onClick={() => start(async () => { await resolveRequest(req.id, 'resolved'); })}
          disabled={pending}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0c0c0c] py-2.5 text-[0.8rem] font-semibold text-white transition hover:bg-black disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Resolve
        </button>
      </div>
    </div>
  );
}

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
