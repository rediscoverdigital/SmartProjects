'use client';

import { useMemo, useState } from 'react';
import { useGuest } from './GuestProvider';
import { Plus, Minus, Trash2, Check, Loader2, ShoppingBag } from 'lucide-react';
import type { CartLine } from './types';

export function OrderView({
  cart,
  setCart,
  go,
}: {
  cart: CartLine[];
  setCart: React.Dispatch<React.SetStateAction<CartLine[]>>;
  go: (v: any) => void;
}) {
  const { data, t, lang, L } = useGuest();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ reference: string; total: number } | null>(null);

  const lines = useMemo(
    () =>
      cart
        .map((l) => {
          const item = data.items.find((i) => i.id === l.itemId);
          return item ? { ...l, item } : null;
        })
        .filter(Boolean) as { itemId: string; qty: number; item: any }[],
    [cart, data.items],
  );

  const total = lines.reduce((n, l) => n + l.item.price * l.qty, 0);

  const setQty = (itemId: string, qty: number) => {
    setCart((c) => (qty <= 0 ? c.filter((l) => l.itemId !== itemId) : c.map((l) => (l.itemId === itemId ? { ...l, qty } : l))));
  };

  const submit = async () => {
    if (!lines.length) return;
    setBusy(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          restaurantId: data.restaurant.id,
          tableId: data.table.id,
          sessionId: data.sessionId,
          note: note.trim() || null,
          items: lines.map((l) => ({ itemId: l.itemId, qty: l.qty })),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSent({ reference: json.reference, total: json.total });
        setCart([]);
      }
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="anim-pop flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--brand-2) 18%, transparent)' }}>
          <Check className="h-8 w-8" style={{ color: 'var(--brand-2)' }} strokeWidth={2.5} />
        </div>
        <h2 className="mt-5 font-display text-2xl" style={{ color: 'var(--ink)' }}>
          {t('order.sent')}
        </h2>
        <p className="mt-2 text-[0.9rem]" style={{ color: 'var(--muted)' }}>
          {t('order.sentBody')}
        </p>
        <div className="mt-5 rounded-2xl border px-6 py-4" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
          <p className="eyebrow" style={{ color: 'var(--muted)' }}>{t('order.reference')}</p>
          <p className="mt-1 font-display text-2xl" style={{ color: 'var(--brand-2)' }}>{sent.reference}</p>
          <p className="mt-1 text-[0.85rem]" style={{ color: 'var(--ink)' }}>Rs {sent.total.toLocaleString('en-US')}</p>
        </div>
        <button onClick={() => go('menu')} className="mt-8 rounded-full px-6 py-3 text-[0.88rem] font-bold" style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}>
          {t('guest.viewMenu')}
        </button>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="anim-in flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--card)' }}>
          <ShoppingBag className="h-7 w-7" style={{ color: 'var(--muted)' }} />
        </div>
        <h2 className="mt-5 font-display text-xl" style={{ color: 'var(--ink)' }}>
          {t('order.empty')}
        </h2>
        <p className="mt-2 text-[0.88rem]" style={{ color: 'var(--muted)' }}>
          {t('order.emptyHint')}
        </p>
        <button onClick={() => go('menu')} className="mt-7 rounded-full px-6 py-3 text-[0.88rem] font-bold" style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}>
          {t('guest.viewMenu')}
        </button>
      </div>
    );
  }

  return (
    <div className="anim-in px-5 pt-4">
      <h1 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>
        {t('order.title')}
      </h1>
      {data.table.label && (
        <p className="mt-1 text-[0.8rem]" style={{ color: 'var(--muted)' }}>
          {t('guest.table')} {data.table.label.replace(/[^0-9]/g, '') || data.table.label} · {data.restaurant.name}
        </p>
      )}

      <div className="mt-5 space-y-2.5">
        {lines.map((l) => (
          <div key={l.itemId} className="flex items-center gap-3 rounded-2xl border p-2.5" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              {l.item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.item.image} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9rem] font-semibold" style={{ color: 'var(--ink)' }}>
                {L(l.item).name}
              </p>
              <p className="text-[0.82rem]" style={{ color: 'var(--brand-2)' }}>
                Rs {l.item.price.toLocaleString('en-US')}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setQty(l.itemId, l.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-full border" style={{ borderColor: 'var(--line)', color: 'var(--ink)' }} aria-label="decrease">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-5 text-center text-[0.88rem] font-bold" style={{ color: 'var(--ink)' }}>
                {l.qty}
              </span>
              <button onClick={() => setQty(l.itemId, l.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }} aria-label="increase">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <label className="eyebrow" style={{ color: 'var(--muted)' }}>{t('order.note')}</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={t('order.notePlaceholder')}
          className="mt-2 w-full resize-none rounded-2xl border px-4 py-3 text-[0.88rem] outline-none transition focus:border-[var(--brand-2)]"
          style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
        />
      </div>

      <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: 'var(--line)' }}>
        <span className="text-[0.9rem] font-semibold" style={{ color: 'var(--muted)' }}>
          {t('order.total')}
        </span>
        <span className="font-display text-2xl" style={{ color: 'var(--brand-2)' }}>
          Rs {total.toLocaleString('en-US')}
        </span>
      </div>

      <button
        onClick={submit}
        disabled={busy}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[0.92rem] font-bold transition active:scale-[0.98] disabled:opacity-50"
        style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {t('order.submit')}
      </button>

      <p className="mt-3 text-center text-[0.7rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
        {t('order.noPayment')}
      </p>
    </div>
  );
}
