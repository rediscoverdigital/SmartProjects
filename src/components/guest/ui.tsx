'use client';

import { cn } from '@/lib/utils';
import { tags } from '@/lib/utils';

// ── Tag pill ───────────────────────────────────────────────
const DIET_STYLE: Record<string, string> = {
  vegetarian: 'text-sage-300 border-sage-300/40',
  vegan: 'text-sage-300 border-sage-300/40',
  'gluten-free': 'text-sky-300 border-sky-300/40',
  'dairy-free': 'text-sky-300 border-sky-300/40',
  halal: 'text-emerald-300 border-emerald-300/40',
  spicy: 'text-orange-300 border-orange-300/40',
  seafood: 'text-cyan-300 border-cyan-300/40',
  alcohol: 'text-purple-300 border-purple-300/40',
};

export function Tag({ label, kind = 'diet' }: { label: string; kind?: 'diet' | 'allergen' | 'spice' }) {
  const key = label.toLowerCase();
  let style = 'border-white/15 text-white/60';
  if (kind === 'diet' && DIET_STYLE[key]) style = DIET_STYLE[key];
  if (kind === 'allergen') style = 'border-amber-400/30 text-amber-300/90';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wide',
        style,
      )}
      style={kind === 'diet' ? undefined : undefined}
    >
      {label}
    </span>
  );
}

export function TagRow({ value, kind }: { value?: string | null; kind?: 'diet' | 'allergen' }) {
  const list = tags(value);
  if (!list.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((x) => (
        <Tag key={x} label={x} kind={kind} />
      ))}
    </div>
  );
}

// ── Spice meter ────────────────────────────────────────────
export function SpiceMeter({ level }: { level: string }) {
  if (!level || level === 'none') return null;
  const n = level === 'mild' ? 1 : level === 'medium' ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-0.5" title={level} aria-label={`spice: ${level}`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className="text-[0.7rem] leading-none"
          style={{ opacity: i < n ? 1 : 0.22 }}
        >
          🌶️
        </span>
      ))}
    </span>
  );
}

// ── Stars ──────────────────────────────────────────────────
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" style={{ gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < value ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" style={{ color: i < value ? 'var(--brand-2)' : 'var(--line)' }}>
          <path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}

// ── Section heading ────────────────────────────────────────
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>
        {children}
      </h2>
      {action}
    </div>
  );
}

// ── Badge (status) ─────────────────────────────────────────
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'gold' | 'green' | 'red' | 'amber';
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-white/10 text-white/70',
    gold: 'text-ink-950',
    green: 'bg-emerald-500/15 text-emerald-300',
    red: 'bg-red-500/15 text-red-300',
    amber: 'bg-amber-500/15 text-amber-300',
  };
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.64rem] font-bold uppercase tracking-wider', tones[tone])}
      style={tone === 'gold' ? { background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' } : undefined}
    >
      {children}
    </span>
  );
}

// ── Skeleton card ──────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--line)' }}>
      <div className="skeleton h-40 w-full" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  );
}
