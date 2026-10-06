'use client';

import { useEffect, useMemo, useState } from 'react';
import { GuestProvider, useGuest } from './GuestProvider';
import type { GuestData, CartLine } from './types';
import { HomeView } from './HomeView';
import { MenuView } from './MenuView';
import { ItemSheet } from './ItemSheet';
import { AiView } from './AiView';
import { ActionsView } from './ActionsView';
import { FeedbackView } from './FeedbackView';
import { OrderView } from './OrderView';
import { AboutView } from './AboutView';
import { Home, UtensilsCrossed, Sparkles, BellRing, ShoppingBag, X } from 'lucide-react';

type View = 'home' | 'menu' | 'ai' | 'actions' | 'feedback' | 'order' | 'about';

export function GuestApp({ data }: { data: GuestData }) {
  return (
    <GuestProvider data={data}>
      <Shell />
    </GuestProvider>
  );
}

function Shell() {
  const { data, t, lang, track } = useGuest();
  const [view, setView] = useState<View>('home');
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);

  // restore cart
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('sm_cart');
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem('sm_cart', JSON.stringify(cart)); } catch {}
  }, [cart]);

  const cartCount = useMemo(() => cart.reduce((n, l) => n + l.qty, 0), [cart]);

  const go = (v: View) => {
    setView(v);
    if (v === 'menu') track('menu_opened');
    if (v === 'ai') track('ai_opened');
    if (v === 'feedback') track('feedback_started');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const openItem = (id: string) => {
    setOpenItemId(id);
    const it = data.items.find((x) => x.id === id);
    if (it) track('item_viewed', { entityType: 'item', entityId: it.id, entityLabel: it.name });
  };

  const addToCart = (itemId: string, qty = 1) => {
    setCart((c) => {
      const found = c.find((l) => l.itemId === itemId);
      if (found) return c.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + qty } : l));
      return [...c, { itemId, qty }];
    });
    track('item_added', { entityType: 'item', entityId: itemId });
  };

  const openItemObj = openItemId ? data.items.find((i) => i.id === openItemId) : null;

  const tabs: { id: View; label: string; icon: any; show: boolean }[] = [
    { id: 'home', label: t('guest.home'), icon: Home, show: true },
    { id: 'menu', label: t('guest.menu'), icon: UtensilsCrossed, show: true },
    { id: 'ai', label: t('guest.ask'), icon: Sparkles, show: data.restaurant.featAi },
    { id: 'actions', label: t('guest.callStaff'), icon: BellRing, show: data.restaurant.featCallStaff || data.restaurant.featBill },
    { id: 'order', label: t('guest.order'), icon: ShoppingBag, show: data.restaurant.featOrder },
  ];

  return (
    <div className="mx-auto min-h-screen w-full max-w-[560px] pb-24" style={{ background: 'var(--surface)' }}>
      {/* top bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 pt-safe backdrop-blur-xl"
        style={{ background: 'color-mix(in srgb, var(--surface) 82%, transparent)', borderBottom: '1px solid var(--line)' }}
      >
        <button onClick={() => go('home')} className="flex items-center gap-2.5 text-left">
          <LogoMark />
          <span className="flex flex-col leading-none">
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
              {data.restaurant.name}
            </span>
            {data.table.label && (
              <span className="mt-0.5 text-[0.6rem] uppercase tracking-wider" style={{ color: 'var(--brand-2)' }}>
                {t('guest.table')} {data.table.label.replace(/[^0-9]/g, '') || data.table.label}
              </span>
            )}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <LangSwitch />
        </div>
      </header>

      {/* views */}
      <main>
        {view === 'home' && <HomeView go={go} openItem={openItem} cartCount={cartCount} />}
        {view === 'menu' && <MenuView openItem={openItem} cart={cart} addToCart={addToCart} />}
        {view === 'ai' && <AiView openItem={openItem} go={go} />}
        {view === 'actions' && <ActionsView go={go} />}
        {view === 'feedback' && <FeedbackView go={go} />}
        {view === 'order' && <OrderView cart={cart} setCart={setCart} go={go} />}
        {view === 'about' && <AboutView go={go} />}
      </main>

      {/* item detail sheet */}
      {openItemObj && (
        <ItemSheet
          item={openItemObj}
          onClose={() => setOpenItemId(null)}
          onAskAi={() => {
            setOpenItemId(null);
            go('ai');
          }}
          addToCart={addToCart}
          openItem={openItem}
        />
      )}

      {/* bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[560px] items-stretch justify-around px-2 pb-safe pt-1.5 backdrop-blur-xl"
        style={{ background: 'color-mix(in srgb, var(--surface) 88%, transparent)', borderTop: '1px solid var(--line)' }}
      >
        {tabs.filter((x) => x.show).map((tab) => {
          const active = view === tab.id || (tab.id === 'menu' && view === 'order');
          return (
            <button
              key={tab.id}
              onClick={() => go(tab.id)}
              className="relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition"
              style={{ color: active ? 'var(--brand-2)' : 'var(--muted)' }}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative">
                <tab.icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={active ? 2.4 : 1.9} />
                {tab.id === 'order' && cartCount > 0 && (
                  <span
                    className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] font-bold"
                    style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}
                  >
                    {cartCount}
                  </span>
                )}
              </span>
              <span className="text-[0.62rem] font-semibold tracking-wide">{tab.label}</span>
              {active && (
                <span className="absolute -top-1.5 h-0.5 w-6 rounded-full" style={{ background: 'var(--brand-2)' }} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function LogoMark() {
  const { data } = useGuest();
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
      style={{ borderColor: 'color-mix(in srgb, var(--brand-2) 55%, transparent)' }}
    >
      <span className="font-display text-[0.8rem]" style={{ color: 'var(--brand-2)' }}>
        {(data.restaurant.logoText || data.restaurant.name).slice(0, 1)}
      </span>
    </span>
  );
}

function LangSwitch() {
  const { lang, setLang } = useGuest();
  return (
    <div className="flex items-center rounded-full border p-0.5" style={{ borderColor: 'var(--line)' }}>
      {(['en', 'fr'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-wider transition"
          style={
            lang === l
              ? { background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }
              : { color: 'var(--muted)' }
          }
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
