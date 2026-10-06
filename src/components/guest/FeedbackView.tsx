'use client';

import { useState } from 'react';
import { useGuest } from './GuestProvider';
import { Check, Loader2 } from 'lucide-react';

export function FeedbackView({ go }: { go: (v: any) => void }) {
  const { data, t, lang, track } = useGuest();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setBusy(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          restaurantId: data.restaurant.id,
          tableId: data.table.id,
          sessionId: data.sessionId,
          rating,
          comment: comment.trim() || null,
        }),
      });
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="anim-pop flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--brand-2) 18%, transparent)' }}>
          <Check className="h-8 w-8" style={{ color: 'var(--brand-2)' }} strokeWidth={2.5} />
        </div>
        <h2 className="mt-5 font-display text-2xl" style={{ color: 'var(--ink)' }}>
          {t('feedback.thanks')}
        </h2>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-xl" style={{ opacity: i < rating ? 1 : 0.25 }}>
              ★
            </span>
          ))}
        </div>
        <button
          onClick={() => go('menu')}
          className="mt-8 rounded-full px-6 py-3 text-[0.88rem] font-bold"
          style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}
        >
          {t('feedback.backToMenu')}
        </button>
      </div>
    );
  }

  return (
    <div className="anim-in px-5 pt-6">
      <h1 className="text-center font-display text-2xl" style={{ color: 'var(--ink)' }}>
        {t('feedback.title')}
      </h1>
      <p className="mt-1.5 text-center text-[0.8rem]" style={{ color: 'var(--muted)' }}>
        {t('feedback.rateHint')}
      </p>

      <div className="mt-8 flex justify-center gap-2.5" onMouseLeave={() => setHover(0)}>
        {Array.from({ length: 5 }).map((_, i) => {
          const v = i + 1;
          const active = v <= (hover || rating);
          return (
            <button
              key={i}
              onMouseEnter={() => setHover(v)}
              onClick={() => {
                setRating(v);
                track('feedback_started', { meta: { rating: v } });
              }}
              className="transition active:scale-90"
              aria-label={`${v} ${v === 1 ? 'star' : 'stars'}`}
            >
              <svg width={40} height={40} viewBox="0 0 24 24" fill={active ? 'var(--brand-2)' : 'none'} stroke={active ? 'var(--brand-2)' : 'var(--line)'} strokeWidth="1.4" style={{ transition: 'all 0.15s' }}>
                <path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9L12 2.5z" />
              </svg>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <label className="eyebrow" style={{ color: 'var(--muted)' }}>
          {t('feedback.placeholder')}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder={lang === 'fr' ? 'Dites-nous en plus…' : 'Tell us more…'}
          className="mt-2 w-full resize-none rounded-2xl border px-4 py-3 text-[0.9rem] outline-none transition focus:border-[var(--brand-2)]"
          style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
        />
      </div>

      <button
        onClick={submit}
        disabled={!rating || busy}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[0.92rem] font-bold transition active:scale-[0.98] disabled:opacity-40"
        style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('feedback.submit')}
      </button>

      <p className="mt-4 text-center text-[0.7rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
        {lang === 'fr'
          ? 'Votre avis reste interne au restaurant.'
          : 'Your feedback stays internal to the restaurant.'}
      </p>
    </div>
  );
}
