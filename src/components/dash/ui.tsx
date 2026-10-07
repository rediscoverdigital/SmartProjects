// Presentational dashboard primitives. Deliberately NOT a client component:
// these render on the server and are also imported by client components.
// (Marking it 'use client' would break passing icon components as props.)
import { cn } from '@/lib/utils';

// ── Stat card ──────────────────────────────────────────────
export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'gold' | 'warn';
  icon?: any;
}) {
  return (
    <div className="dash-card p-4">
      <div className="flex items-start justify-between">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-black/25" />}
      </div>
      <p
        className={cn(
          'mt-2 font-display text-[1.8rem] leading-none',
          tone === 'gold' && 'text-[#8E7642]',
          tone === 'warn' && 'text-[#C25E1E]',
        )}
      >
        {typeof value === 'number' ? value.toLocaleString('en-US') : value}
      </p>
      {hint && <p className="mt-1.5 text-[0.72rem] text-black/45">{hint}</p>}
    </div>
  );
}

// ── Bar chart (pure CSS, no deps) ──────────────────────────
export function BarChart({ data, height = 120 }: { data: { label: string; count: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group relative flex flex-1 flex-col items-center justify-end">
          <div
            className="w-full rounded-t-[3px] bg-[#0c0c0c] transition-all duration-300 hover:bg-[#8E7642]"
            style={{ height: `${Math.max((d.count / max) * 100, 2)}%` }}
          />
          <div className="pointer-events-none absolute bottom-full mb-1.5 hidden whitespace-nowrap rounded-lg bg-[#0c0c0c] px-2 py-1 text-[0.68rem] text-white group-hover:block">
            {d.label}: {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Horizontal bar list ────────────────────────────────────
export function BarList({ items, accent = '#8E7642' }: { items: { label: string; count: number; sub?: string }[]; accent?: string }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-[0.8rem]">
            <span className="truncate font-medium text-black/80">{it.label}</span>
            <span className="ml-2 shrink-0 tabular-nums text-black/50">{it.count.toLocaleString('en-US')}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(it.count / max) * 100}%`, background: accent }} />
          </div>
          {it.sub && <p className="mt-0.5 text-[0.68rem] text-black/40">{it.sub}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Donut (NFC vs QR) ──────────────────────────────────────
export function Donut({ segments, size = 120 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((n, s) => n + s.value, 0) || 1;
  let acc = 0;
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-acc * c}
              strokeLinecap="butt"
            />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className="space-y-2">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-[0.8rem] text-black/70">{s.label}</span>
            <span className="font-display text-[0.95rem]">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status pill ────────────────────────────────────────────
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    new: { bg: 'rgba(194,94,30,0.12)', fg: '#C25E1E', label: 'New' },
    submitted: { bg: 'rgba(194,94,30,0.12)', fg: '#C25E1E', label: 'New' },
    acknowledged: { bg: 'rgba(174,148,85,0.15)', fg: '#8E7642', label: 'Acknowledged' },
    served: { bg: 'rgba(126,143,114,0.16)', fg: '#4F5C46', label: 'Served' },
    resolved: { bg: 'rgba(126,143,114,0.16)', fg: '#4F5C46', label: 'Resolved' },
    cancelled: { bg: 'rgba(0,0,0,0.06)', fg: '#6b6b6b', label: 'Cancelled' },
    active: { bg: 'rgba(126,143,114,0.16)', fg: '#4F5C46', label: 'Active' },
    suspended: { bg: 'rgba(194,94,30,0.12)', fg: '#C25E1E', label: 'Suspended' },
    lost: { bg: 'rgba(0,0,0,0.08)', fg: '#6b6b6b', label: 'Lost' },
    replaced: { bg: 'rgba(0,0,0,0.06)', fg: '#6b6b6b', label: 'Replaced' },
    available: { bg: 'rgba(126,143,114,0.16)', fg: '#4F5C46', label: 'Available' },
    sold_out: { bg: 'rgba(194,94,30,0.12)', fg: '#C25E1E', label: 'Sold out' },
    hidden: { bg: 'rgba(0,0,0,0.06)', fg: '#6b6b6b', label: 'Hidden' },
    coming_soon: { bg: 'rgba(174,148,85,0.15)', fg: '#8E7642', label: 'Coming soon' },
  };
  const s = map[status] || { bg: 'rgba(0,0,0,0.06)', fg: '#6b6b6b', label: status };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-wide" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-[1.15rem] text-black/85">{title}</h2>
      {action}
    </div>
  );
}

export function Empty({ icon: Icon, title, body, action }: { icon?: any; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04]">
          <Icon className="h-5 w-5 text-black/30" />
        </span>
      )}
      <p className="mt-4 font-display text-[1.05rem] text-black/75">{title}</p>
      {body && <p className="mt-1.5 max-w-xs text-[0.82rem] text-black/45">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
