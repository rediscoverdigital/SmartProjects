'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BellRing, Check, Droplets, Scissors, Utensils, Sparkles, Baby, Receipt, MoreHorizontal, Clock, Wifi, WifiOff } from 'lucide-react';

export type Req = {
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

// Flashing thresholds (measured from createdAt)
const YELLOW_MS = 2 * 60 * 1000; // 2 min — flash orange
const RED_MS = 5 * 60 * 1000; // 5 min — flash red

export function TvFloor({
  token,
  restaurantName,
  initialRequests,
}: {
  token: string;
  restaurantName: string;
  initialRequests: Req[];
}) {
  const [requests, setRequests] = useState<Req[]>(initialRequests);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const esRef = useRef<EventSource | null>(null);

  // Live updates via SSE; falls back to polling if SSE drops.
  useEffect(() => {
    let es: EventSource | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (pollId) return;
      const poll = async () => {
        try {
          const res = await fetch(`/api/floor?tv=${encodeURIComponent(token)}`, { cache: 'no-store' });
          if (res.ok) setRequests(await res.json());
        } catch {
          /* keep last state */
        }
      };
      poll();
      pollId = setInterval(poll, 30_000); // 30s fallback when SSE unavailable
    };

    try {
      es = new EventSource(`/api/floor?live=sse&tv=${encodeURIComponent(token)}`);
      esRef.current = es;
      es.onopen = () => {
        setConnected(true);
        if (pollId) {
          clearInterval(pollId);
          pollId = null;
        }
      };
      es.onmessage = (e) => {
        if (!e.data || e.data.startsWith(':')) return;
        try {
          setRequests(JSON.parse(e.data));
        } catch {
          /* ignore malformed frame */
        }
      };
      es.onerror = () => {
        setConnected(false);
        // EventSource auto-reconnects; poll meanwhile so the board stays fresh
        startPolling();
      };
    } catch {
      startPolling();
    }

    const tick = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      es?.close();
      if (pollId) clearInterval(pollId);
      clearInterval(tick);
    };
  }, [token]);

  const open = requests
    .filter((r) => r.status === 'new' || r.status === 'acknowledged')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const done = requests
    .filter((r) => r.status === 'resolved' || r.status === 'cancelled')
    .slice(0, 10);

  const nowStr = new Date(now).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0c0c0c] text-white">
      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-white/10 bg-black/60 px-8 py-4">
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C25E1E]">
            <BellRing className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="font-display text-2xl leading-none">Live Floor</h1>
            <p className="mt-0.5 text-sm text-white/45">{restaurantName}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            {connected ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-amber-400" />
                <span className="text-amber-400">Reconnecting…</span>
              </>
            )}
          </div>
          <div className="text-right">
            <p className="font-display text-2xl leading-none tabular-nums">{nowStr}</p>
            <p className="mt-0.5 text-sm text-white/45">
              {open.length === 0 ? 'All clear' : `${open.length} open`}
            </p>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-y-auto p-6">
        {open.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-10 w-10 text-emerald-400" />
              </span>
              <p className="mt-5 font-display text-3xl text-white/80">All clear</p>
              <p className="mt-1.5 text-white/40">New requests appear here the moment a guest taps.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {open.map((r) => (
              <TvCard key={r.id} req={r} now={now} token={token} />
            ))}
          </div>
        )}

        {done.length > 0 && (
          <section className="mt-8 border-t border-white/10 pt-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/35">
              Recently closed
            </h2>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-5">
              {done.map((r) => (
                <div key={r.id} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm">
                  <span className="font-semibold text-white/50">{r.tableLabel}</span>
                  <span className="truncate capitalize text-white/35">{r.label}</span>
                  <span className="ml-auto flex-shrink-0 text-white/25">{ago(r.createdAt)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <style>{`
        @keyframes tv-flash-orange {
          0%, 100% { background-color: rgba(194,94,30,0.16); border-color: rgba(194,94,30,0.85); }
          50%      { background-color: rgba(194,94,30,0.42); border-color: rgba(255,140,60,1); }
        }
        @keyframes tv-flash-red {
          0%, 100% { background-color: rgba(220,38,38,0.20); border-color: rgba(220,38,38,0.85); }
          50%      { background-color: rgba(220,38,38,0.55); border-color: rgba(255,80,80,1); }
        }
        .tv-flash-orange { animation: tv-flash-orange 1.6s ease-in-out infinite; }
        .tv-flash-red    { animation: tv-flash-red 0.9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .tv-flash-orange, .tv-flash-red { animation: none; }
          .tv-flash-orange { background-color: rgba(194,94,30,0.35); border-color: rgba(194,94,30,0.9); }
          .tv-flash-red { background-color: rgba(220,38,38,0.45); border-color: rgba(220,38,38,0.95); }
        }
      `}</style>
    </div>
  );
}

function TvCard({ req, now, token }: { req: Req; now: number; token: string }) {
  const Icon = ICONS[req.kind] || MoreHorizontal;
  const [pending, setPending] = useState(false);

  const ageMs = now - new Date(req.createdAt).getTime();
  const ageMin = Math.floor(ageMs / 60000);

  // Escalation: orange after 2 min unacknowledged, red after 5 min.
  // Acknowledged requests stop escalating (staff are on it).
  const isUnacknowledged = req.status === 'new';
  let flash = '';
  if (isUnacknowledged && ageMs >= RED_MS) flash = 'tv-flash-red';
  else if (isUnacknowledged && ageMs >= YELLOW_MS) flash = 'tv-flash-orange';

  const act = async (status: 'acknowledged' | 'resolved') => {
    setPending(true);
    try {
      await fetch('/api/tv-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, requestId: req.id, status }),
      });
      // The SSE stream will push the updated list within ~5s
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border-2 p-5 transition-colors
        ${flash || (req.status === 'new' ? 'border-[#C25E1E]/40 bg-white/[0.06]' : 'border-white/10 bg-white/[0.04]')}
      `}
    >
      <div className="flex items-start gap-4">
        <span className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${flash ? 'bg-black/30' : 'bg-[#C25E1E]/15'}`}>
          <Icon className="h-7 w-7 text-[#C25E1E]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl leading-tight">{req.tableLabel}</p>
          <p className="text-lg capitalize text-white/75">{req.label}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/45">
            <Clock className="h-3.5 w-3.5" />
            {ageMin < 1 ? 'just now' : `${ageMin} min${ageMin === 1 ? '' : 's'}`}
            {ageMin >= 5 && isUnacknowledged && <span className="ml-1 font-semibold text-red-300">· needs attention</span>}
            {ageMin >= 2 && ageMin < 5 && isUnacknowledged && <span className="ml-1 font-semibold text-orange-300">· waiting</span>}
          </p>
        </div>
      </div>

      {req.note && (
        <p className="mt-3 rounded-lg bg-black/40 px-3 py-2 text-sm italic text-white/80">“{req.note}”</p>
      )}

      <div className="mt-4 flex gap-2">
        {req.status === 'new' && (
          <button
            onClick={() => act('acknowledged')}
            disabled={pending}
            className="flex-1 rounded-xl bg-white/15 py-3 text-base font-semibold text-white transition hover:bg-white/25 disabled:opacity-50"
          >
            Accept
          </button>
        )}
        <button
          onClick={() => act('resolved')}
          disabled={pending}
          className="flex-1 rounded-xl bg-emerald-600 py-3 text-base font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          Resolve
        </button>
      </div>
    </div>
  );
}

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}
