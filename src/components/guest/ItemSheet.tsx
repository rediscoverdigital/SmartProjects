'use client';

import { useEffect } from 'react';
import { useGuest } from './GuestProvider';
import { X, Sparkles, Plus, Minus, Check, Clock, Flame, Star } from 'lucide-react';
import { Tag, TagRow, SpiceMeter } from './ui';

export function ItemSheet({
  item,
  onClose,
  onAskAi,
  addToCart,
  openItem,
}: {
  item: any;
  onClose: () => void;
  onAskAi: () => void;
  addToCart: (id: string, qty?: number) => void;
  openItem: (id: string) => void;
}) {
  const { t, L, data, lang } = useGuest();
  const l = L(item);
  const soldOut = item.status === 'sold_out';

  // lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dietary = item.dietaryTags ? item.dietaryTags.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const allergens = item.allergens ? item.allergens.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const ingredients = item.ingredients ? item.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  // upsell suggestions — same category, available, not this item
  const upsell = data.items
    .filter((x) => x.id !== item.id && x.categoryId === item.categoryId && x.status === 'available' && x.recommended)
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm anim-in" onClick={onClose} />
      <div
        className="anim-pop relative z-10 max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-3xl border-t sm:rounded-3xl sm:border"
        style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
      >
        {/* image */}
        <div className="relative h-[260px] w-full overflow-hidden rounded-t-3xl">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: 'var(--card-strong)' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--surface) 2%, transparent 45%)' }} />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition active:scale-95"
            style={{ borderColor: 'var(--line)', background: 'color-mix(in srgb, var(--surface) 70%, transparent)', color: 'var(--ink)' }}
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
          {item.isSpecial && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.66rem] font-bold uppercase tracking-wider" style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}>
              <Star className="h-3 w-3" fill="currentColor" /> {t('menu.special')}
            </span>
          )}
        </div>

        <div className="px-5 pb-28">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-[1.7rem] leading-tight" style={{ color: 'var(--ink)' }}>
              {l.name}
            </h2>
            <span className="shrink-0 font-display text-[1.3rem]" style={{ color: 'var(--brand-2)' }}>
              Rs {item.price.toLocaleString('en-US')}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            {item.prepMinutes && (
              <span className="inline-flex items-center gap-1 text-[0.78rem]" style={{ color: 'var(--muted)' }}>
                <Clock className="h-3.5 w-3.5" /> {item.prepMinutes} {t('menu.prepTime')}
              </span>
            )}
            <SpiceMeter level={item.spiceLevel} />
            {item.calories && (
              <span className="text-[0.78rem]" style={{ color: 'var(--muted)' }}>
                {item.calories} {t('menu.kcal')}
              </span>
            )}
          </div>

          {l.description && (
            <p className="mt-4 text-[0.95rem] leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.86 }}>
              {l.description}
            </p>
          )}

          {dietary.length > 0 && (
            <div className="mt-5">
              <p className="eyebrow" style={{ color: 'var(--muted)' }}>{t('menu.dietary')}</p>
              <div className="mt-2"><TagRow value={item.dietaryTags} /></div>
            </div>
          )}

          {ingredients.length > 0 && (
            <div className="mt-5">
              <p className="eyebrow" style={{ color: 'var(--muted)' }}>{t('menu.ingredients')}</p>
              <p className="mt-1.5 text-[0.88rem] capitalize leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.75 }}>
                {ingredients.join(' · ')}
              </p>
            </div>
          )}

          {allergens.length > 0 && (
            <div className="mt-5">
              <p className="eyebrow" style={{ color: 'var(--muted)' }}>{t('menu.allergens')}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {allergens.map((a: string) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold capitalize" style={{ borderColor: 'color-mix(in srgb, #d9762f 40%, transparent)', color: '#e6a06a' }}>
                    <Flame className="h-3 w-3" /> {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.aiNote && (
            <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
              <p className="eyebrow" style={{ color: 'var(--brand-2)' }}>{t('menu.chefRecommends')}</p>
              <p className="mt-1.5 text-[0.88rem] italic leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.82 }}>
                {item.aiNote}
              </p>
            </div>
          )}

          {upsell.length > 0 && (
            <div className="mt-5">
              <p className="eyebrow" style={{ color: 'var(--muted)' }}>{lang === 'fr' ? 'À essayer aussi' : 'Try with'}</p>
              <div className="mt-2.5 space-y-2">
                {upsell.map((u) => {
                  const ul = L(u);
                  return (
                    <button
                      key={u.id}
                      onClick={() => openItem(u.id)}
                      className="flex w-full items-center gap-3 rounded-xl border p-2 text-left transition active:scale-[0.99]"
                      style={{ borderColor: 'var(--line)', background: 'var(--card)' }}
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                        {u.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.image} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <span className="flex-1 truncate text-[0.85rem] font-semibold" style={{ color: 'var(--ink)' }}>
                        {ul.name}
                      </span>
                      <span className="text-[0.82rem]" style={{ color: 'var(--brand-2)' }}>
                        Rs {u.price.toLocaleString('en-US')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* allergen disclaimer */}
          <p className="mt-6 rounded-xl border p-3 text-[0.7rem] leading-relaxed" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
            {t('disclaimer.allergens')}
          </p>
        </div>

        {/* sticky actions */}
        <div
          className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[560px] items-center gap-2.5 px-5 py-3.5 pb-safe backdrop-blur-xl"
          style={{ background: 'color-mix(in srgb, var(--surface) 90%, transparent)', borderTop: '1px solid var(--line)' }}
        >
          {data.restaurant.featAi && (
            <button
              onClick={onAskAi}
              className="flex h-11 items-center gap-2 rounded-full border px-4 text-[0.85rem] font-semibold transition active:scale-95"
              style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
            >
              <Sparkles className="h-4 w-4" style={{ color: 'var(--brand-2)' }} />
              <span className="hidden sm:inline">{t('menu.askAbout')}</span>
              <span className="sm:hidden">AI</span>
            </button>
          )}
          {soldOut ? (
            <div className="flex h-11 flex-1 items-center justify-center rounded-full border text-[0.85rem] font-semibold" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
              {t('menu.unavailable')}
            </div>
          ) : data.restaurant.featOrder ? (
            <button
              onClick={() => {
                addToCart(item.id, 1);
                onClose();
              }}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[0.9rem] font-bold transition active:scale-[0.98]"
              style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}
            >
              <Plus className="h-4 w-4" /> {t('menu.addToOrder')} · Rs {item.price.toLocaleString('en-US')}
            </button>
          ) : (
            <button
              onClick={onAskAi}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[0.9rem] font-bold transition active:scale-[0.98]"
              style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}
            >
              <Sparkles className="h-4 w-4" /> {t('menu.askAbout')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
