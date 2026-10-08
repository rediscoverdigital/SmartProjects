'use client';

import { useTransition, useState, useEffect, useCallback } from 'react';
import { resolveRequest } from '@/app/actions/dashboard';
import { StatusPill, Empty, SectionHeading } from './ui';
import { TvModePanel } from './TvModePanel';
import { BellRing, Check, X, Loader2, RefreshCw, Receipt, Droplets, Scissors, Utensils, Sparkles, Baby, MoreHorizontal } from 'lucide-react';

type Req = {
  id: string;
  kind: string;
  label: string;
  status: string;
  note: string | null;
  tableLabel: string;
  createdAt: string;
};

const REFRESH_INTERVAL_MS = 120_000; // 2 minutes

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

export function FloorBoard({ requests: initialRequests, tvToken = null }: { requests: Req[]; tvToken?: string | null }) {
  const [requests, setRequests] = useState<Req[]>(initialRequests);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);

  // Live updates: SSE pushes new requests instantly; polling is the fallback.
  useEffect(() => {
    let es: EventSource | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const startPolling = () => {
      if (pollId) return;
      const poll = async () => {
        try {
          const res = await fetch('/api/floor', { cache: 'no-store' });
          if (res.ok && !cancelled) {
            setRequests(await res.json());
            setLastRefresh(new Date());
          }
        } catch {
          /* keep last known state */
        }
      };
      poll();
      pollId = setInterval(poll, REFRESH_INTERVAL_MS);
    };

    try {
      es = new EventSource('/api/floor?live=sse');
      es.onopen = () => {
        setConnected(true);
        setLastRefresh(new Date());
        if (pollId) {
          clearInterval(pollId);
          pollId = null;
        }
      };
      es.onmessage = (e) => {
        if (!e.data || e.data.startsWith(':')) return;
        try {
          setRequests(JSON.parse(e.data));
          setLastRefresh(new Date());
        } catch {
          /* ignore malformed frame */
        }
      };
      es.onerror = () => {
        setConnected(false);
        startPolling(); // EventSource reconnects on its own; poll meanwhile
      };
    } catch {
      startPolling();
    }

    const tickId = setInterval(() => setTick((t) => t + 1), 30000);

    return () => {
      cancelled = true;
      es?.close();
      if (pollId) clearInterval(pollId);
      clearInterval(tickId);
    };
  }, []);

  // Manual + post-action refresh (SSE will also push, this just makes it snappy)
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/floor', { cache: 'no-store' });
      if (res.ok) {
        setRequests(await res.json());
        setLastRefresh(new Date());
      }
    } catch {
      // network errors are non-fatal; keep showing the last known state
    } finally {
      setLoading(false);
    }
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
        <div className="mt-2 flex items-center gap-2 text-[0.72rem] text-black/40">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          <span>
            {connected
              ? `Live — updates appear instantly · last ${lastRefresh ? lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}`
              : lastRefresh
                ? `Reconnecting · last updated ${lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                : 'Connecting to live updates…'}
          </span>
        </div>
      </div>

      {open.length === 0 ? (
        <div className="dash-card">
          <Empty icon={BellRing} title="All clear" body="No open service requests right now. New requests appear here instantly." />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {open.map((r) => (
            <RequestCard key={r.id} req={r} onResolved={refresh} />
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

      <TvModePanel initialToken={tvToken} />

      <style>{`
        @keyframes flash-orange {
          0%, 100% { box-shadow: 0 0 0 2px rgba(194,94,30,0.35); background-color: rgba(194,94,30,0.06); }
          50%      { box-shadow: 0 0 0 3px rgba(194,94,30,0.85); background-color: rgba(194,94,30,0.16); }
        }
        @keyframes flash-red {
          0%, 100% { box-shadow: 0 0 0 2px rgba(220,38,38,0.40); background-color: rgba(220,38,38,0.07); }
          50%      { box-shadow: 0 0 0 3px rgba(220,38,38,0.95); background-color: rgba(220,38,38,0.18); }
        }
        .flash-orange { animation: flash-orange 1.6s ease-in-out infinite; }
        .flash-red    { animation: flash-red 0.9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .flash-orange, .flash-red { animation: none; }
          .flash-orange { box-shadow: 0 0 0 3px rgba(194,94,30,0.8); }
          .flash-red { box-shadow: 0 0 0 3px rgba(220,38,38,0.9); }
        }
      `}</style>
    </div>
  );
}

function RequestCard({ req, onResolved }: { req: Req; onResolved: () => Promise<void> }) {
  const [pending, start] = useTransition();
  const [, setNow] = useState(0);
  const Icon = ICONS[req.kind] || MoreHorizontal;
  const isNew = req.status === 'new';

  // re-render every 30s so escalation classes stay current
  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const ageMs = Date.now() - new Date(req.createdAt).getTime();
  const isUnacknowledged = isNew;
  let escalate = '';
  if (isUnacknowledged && ageMs >= 5 * 60 * 1000) escalate = 'flash-red';
  else if (isUnacknowledged && ageMs >= 2 * 60 * 1000) escalate = 'flash-orange';

  const act = (status: 'acknowledged' | 'resolved') =>
    start(async () => {
      await resolveRequest(req.id, status);
      await onResolved();
    });

  return (
    <div className={`dash-card p-4 ${escalate || (isNew ? 'ring-2 ring-[#C25E1E]/25' : '')}`}>
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
            onClick={() => act('acknowledged')}
            disabled={pending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white py-2.5 text-[0.8rem] font-semibold transition hover:border-black/25 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Acknowledge
          </button>
        )}
        <button
          onClick={() => act('resolved')}
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
