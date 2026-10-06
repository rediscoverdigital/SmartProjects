'use client';

import { useState } from 'react';
import { useGuest } from './GuestProvider';
import { BellRing, Receipt, Droplets, Scissors, Utensils, Sparkles, Baby, MoreHorizontal, Check, ArrowLeft, Loader2 } from 'lucide-react';

const REQUESTS: { kind: string; icon: any; en: string; fr: string }[] = [
  { kind: 'call_staff', icon: BellRing, en: 'Call staff', fr: 'Appeler le service' },
  { kind: 'bill', icon: Receipt, en: 'Request the bill', fr: "Demander l'addition" },
  { kind: 'water', icon: Droplets, en: 'Water', fr: 'De l’eau' },
  { kind: 'napkins', icon: Scissors, en: 'Napkins', fr: 'Serviettes' },
  { kind: 'cutlery', icon: Utensils, en: 'Cutlery', fr: 'Couverts' },
  { kind: 'condiments', icon: Sparkles, en: 'Condiments', fr: 'Condiments' },
  { kind: 'high_chair', icon: Baby, en: 'High chair', fr: 'Chaise haute' },
  { kind: 'other', icon: MoreHorizontal, en: 'Something else', fr: 'Autre chose' },
];

export function ActionsView({ go }: { go: (v: any) => void }) {
  const { data, t, lang, track } = useGuest();
  const r = data.restaurant;
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const available = REQUESTS.filter((q) => {
    if (q.kind === 'call_staff') return r.featCallStaff;
    if (q.kind === 'bill') return r.featBill;
    return r.featCallStaff; // other service requests follow the call-staff feature
  });

  const send = async (kind: string) => {
    setBusy(kind);
    try {
      await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          restaurantId: r.id,
          tableId: data.table.id,
          sessionId: data.sessionId,
          kind,
          label: REQUESTS.find((x) => x.kind === kind)?.[lang === 'fr' ? 'fr' : 'en'],
        }),
      });
      setSent(kind);
    } catch {
      setSent('error');
    } finally {
      setBusy(null);
    }
  };

  if (sent) {
    const isBill = sent === 'bill';
    return (
      <div className="anim-pop flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--brand-2) 18%, transparent)' }}>
          <Check className="h-8 w-8" style={{ color: 'var(--brand-2)' }} strokeWidth={2.5} />
        </div>
        <h2 className="mt-5 font-display text-2xl" style={{ color: 'var(--ink)' }}>
          {sent === 'error' ? t('err.network') : isBill ? t('action.billDone') : t('action.callStaffDone')}
        </h2>
        <p className="mt-2 max-w-xs text-[0.9rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
          {sent === 'error' ? t('err.networkBody') : isBill ? t('action.billDoneBody') : t('action.callStaffDoneBody')}
        </p>
        <div className="mt-8 flex flex-col gap-2.5">
          <button onClick={() => setSent(null)} className="rounded-full border px-6 py-3 text-[0.88rem] font-semibold" style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}>
            {t('action.sendAnother')}
          </button>
          <button onClick={() => go('menu')} className="rounded-full px-6 py-3 text-[0.88rem] font-bold" style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}>
            {t('guest.viewMenu')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anim-in px-5 pt-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--brand-2) 16%, transparent)' }}>
          <BellRing className="h-5 w-5" style={{ color: 'var(--brand-2)' }} />
        </span>
        <div>
          <h1 className="font-display text-xl" style={{ color: 'var(--ink)' }}>
            {t('action.whatDoYouNeed')}
          </h1>
          {data.table.label && (
            <p className="text-[0.78rem]" style={{ color: 'var(--muted)' }}>
              {t('guest.table')} {data.table.label.replace(/[^0-9]/g, '') || data.table.label} · {r.name}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {available.map((q) => (
          <button
            key={q.kind}
            onClick={() => send(q.kind)}
            disabled={!!busy}
            className="flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.98] disabled:opacity-60"
            style={{ borderColor: 'var(--line)', background: 'var(--card)' }}
          >
            {busy === q.kind ? (
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--brand-2)' }} />
            ) : (
              <q.icon className="h-5 w-5" style={{ color: 'var(--brand-2)' }} />
            )}
            <span className="text-[0.88rem] font-semibold" style={{ color: 'var(--ink)' }}>
              {lang === 'fr' ? q.fr : q.en}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-[0.75rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
        {lang === 'fr'
          ? 'Un membre de l’équipe est prévenu immédiatement.'
          : 'A member of the team is notified immediately.'}
      </p>
    </div>
  );
}
