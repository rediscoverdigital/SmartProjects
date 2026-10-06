'use client';

import { useGuest } from './GuestProvider';
import { useMemo } from 'react';
import { UtensilsCrossed, Sparkles, Flame, BellRing, Receipt, Info, Star, ArrowRight, MessageSquareHeart } from 'lucide-react';
import { Stars } from './ui';

type View = 'home' | 'menu' | 'ai' | 'actions' | 'feedback' | 'order' | 'about';

export function HomeView({
  go,
  openItem,
  cartCount,
}: {
  go: (v: View) => void;
  openItem: (id: string) => void;
  cartCount: number;
}) {
  const { data, t, L } = useGuest();
  const r = data.restaurant;

  const specials = useMemo(() => data.items.filter((i) => i.isSpecial && i.status !== 'hidden'), [data.items]);
  const recommended = useMemo(
    () => data.items.filter((i) => i.recommended && !i.isSpecial && i.status === 'available').slice(0, 3),
    [data.items],
  );

  const actions: { key: string; label: string; icon: any; onClick: () => void; show: boolean; primary?: boolean }[] = [
    { key: 'menu', label: t('guest.viewMenu'), icon: UtensilsCrossed, onClick: () => go('menu'), show: true, primary: true },
    { key: 'ai', label: t('guest.askAi'), icon: Sparkles, onClick: () => go('ai'), show: r.featAi },
    { key: 'specials', label: t('guest.specials'), icon: Flame, onClick: () => go('menu'), show: r.featSpecials },
    { key: 'staff', label: t('guest.callStaff'), icon: BellRing, onClick: () => go('actions'), show: r.featCallStaff },
    { key: 'bill', label: t('guest.requestBill'), icon: Receipt, onClick: () => go('actions'), show: r.featBill },
    { key: 'about', label: t('guest.aboutUs'), icon: Info, onClick: () => go('about'), show: r.featAbout },
    { key: 'feedback', label: t('guest.feedback'), icon: MessageSquareHeart, onClick: () => go('feedback'), show: r.featFeedback },
  ].filter((a) => a.show);

  return (
    <div className="anim-in">
      {/* hero */}
      <div className="relative">
        <div className="relative h-[240px] w-full overflow-hidden">
          {r.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full" style={{ background: 'linear-gradient(160deg, var(--brand), var(--surface))' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--surface) 4%, color-mix(in srgb, var(--surface) 30%, transparent) 55%, transparent)' }} />
        </div>
        <div className="relative -mt-16 px-5">
          {data.table.label && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.14em] backdrop-blur"
              style={{ borderColor: 'var(--line)', background: 'color-mix(in srgb, var(--surface) 70%, transparent)', color: 'var(--brand-2)' }}
            >
              {t('guest.youAreAt')} {t('guest.table')} {data.table.label.replace(/[^0-9]/g, '') || data.table.label}
            </span>
          )}
          <h1 className="mt-3 font-display text-[2rem] leading-[1.08]" style={{ color: 'var(--ink)' }}>
            {r.name}
          </h1>
          {r.tagline && (
            <p className="mt-2 max-w-sm text-[0.95rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {r.tagline}
            </p>
          )}
          {r.welcomeMsg && (
            <p className="mt-3 max-w-sm text-[0.88rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {r.welcomeMsg}
            </p>
          )}
        </div>
      </div>

      {/* primary actions */}
      <div className="mt-7 grid grid-cols-2 gap-3 px-5">
        {actions.map((a, i) => (
          <button
            key={a.key}
            onClick={a.onClick}
            className="group flex items-center gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.98]"
            style={{
              borderColor: a.primary ? 'var(--brand-2)' : 'var(--line)',
              background: a.primary ? 'var(--brand-2)' : 'var(--card)',
              color: a.primary ? 'var(--on-accent, #0a0f16)' : 'var(--ink)',
              gridColumn: i === 0 ? 'span 2' : undefined,
            }}
          >
            <a.icon className="h-5 w-5 shrink-0" strokeWidth={2} style={{ color: a.primary ? 'var(--on-accent, #0a0f16)' : 'var(--brand-2)' }} />
            <span className="text-[0.9rem] font-semibold">{a.label}</span>
            <ArrowRight className="ml-auto h-4 w-4 opacity-40 transition group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      {/* specials */}
      {r.featSpecials && specials.length > 0 && (
        <section className="mt-9">
          <div className="flex items-center gap-2 px-5">
            <Flame className="h-4 w-4" style={{ color: 'var(--brand-2)' }} />
            <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>
              {t('guest.specials')}
            </h2>
          </div>
          <div className="no-scrollbar mt-4 flex gap-3.5 overflow-x-auto px-5 pb-1">
            {specials.map((it) => {
              const l = L(it);
              return (
                <button
                  key={it.id}
                  onClick={() => openItem(it.id)}
                  className="group relative w-[240px] shrink-0 overflow-hidden rounded-2xl border text-left"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <div className="relative h-[150px] w-full overflow-hidden">
                    {it.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt="" className="img-zoom h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    {it.status === 'sold_out' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
                          {t('menu.soldOut')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5" style={{ background: 'var(--card)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-[1.05rem] leading-tight" style={{ color: 'var(--ink)' }}>
                        {l.name}
                      </h3>
                    </div>
                    {l.description && (
                      <p className="clamp-2 mt-1.5 text-[0.8rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
                        {l.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-display text-[1.05rem]" style={{ color: 'var(--brand-2)' }}>
                        Rs {it.price.toLocaleString('en-US')}
                      </span>
                      {it.prepMinutes && (
                        <span className="text-[0.7rem]" style={{ color: 'var(--muted)' }}>
                          {it.prepMinutes} {t('menu.prepTime')}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* recommended */}
      {recommended.length > 0 && (
        <section className="mt-9 px-5">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" style={{ color: 'var(--brand-2)' }} />
            <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>
              {t('menu.chefRecommends')}
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            {recommended.map((it) => {
              const l = L(it);
              return (
                <button
                  key={it.id}
                  onClick={() => openItem(it.id)}
                  className="group flex w-full items-center gap-3.5 rounded-2xl border p-2.5 text-left transition active:scale-[0.99]"
                  style={{ borderColor: 'var(--line)', background: 'var(--card)' }}
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    {it.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt="" className="img-zoom h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-[1rem]" style={{ color: 'var(--ink)' }}>
                      {l.name}
                    </h3>
                    {l.description && (
                      <p className="clamp-2 mt-0.5 text-[0.78rem] leading-snug" style={{ color: 'var(--muted)' }}>
                        {l.description}
                      </p>
                    )}
                  </div>
                  <span className="font-display text-[0.95rem]" style={{ color: 'var(--brand-2)' }}>
                    Rs {it.price.toLocaleString('en-US')}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* AI CTA */}
      {r.featAi && (
        <div className="mt-9 px-5">
          <button
            onClick={() => go('ai')}
            className="flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition active:scale-[0.99]"
            style={{ borderColor: 'color-mix(in srgb, var(--brand-2) 45%, transparent)', background: 'color-mix(in srgb, var(--brand-2) 8%, transparent)' }}
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--brand-2)' }}>
              <Sparkles className="h-5 w-5" style={{ color: 'var(--on-accent, #0a0f16)' }} />
              <span className="absolute inset-0 rounded-full anim-[pulse-ring]" style={{ background: 'var(--brand-2)', animation: 'pulse-ring 2.4s ease-out infinite', opacity: 0.5 }} />
            </span>
            <span className="flex-1">
              <span className="block text-[0.92rem] font-semibold" style={{ color: 'var(--ink)' }}>
                {t('ai.greeting')}
              </span>
              <span className="mt-0.5 block text-[0.78rem]" style={{ color: 'var(--muted)' }}>
                {t('ai.subtitle')}
              </span>
            </span>
            <ArrowRight className="h-4 w-4" style={{ color: 'var(--brand-2)' }} />
          </button>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}
