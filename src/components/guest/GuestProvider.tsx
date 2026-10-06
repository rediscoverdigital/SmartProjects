'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { GuestRestaurant, GuestData } from './types';
import { makeT, type Lang } from '@/lib/i18n';
import { readableOn } from '@/lib/utils';

type GuestCtx = {
  data: GuestData;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  L: <T extends { name: string; nameFr?: string | null; description?: string | null; descriptionFr?: string | null }>(o: T) => { name: string; description: string | null };
  track: (event: string, opts?: { entityType?: string; entityId?: string; entityLabel?: string; meta?: Record<string, unknown> }) => void;
};

const Ctx = createContext<GuestCtx | null>(null);

export function useGuest() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGuest outside provider');
  return c;
}

export function GuestProvider({ data, children }: { data: GuestData; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(data.restaurant.defaultLang);
  const r = data.restaurant;

  // apply theme as CSS variables so every component themes automatically
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand', r.primaryColor);
    root.style.setProperty('--brand-2', r.accentColor);
    root.style.setProperty('--surface', r.surfaceColor);
    root.style.setProperty('--ink', r.textColor);
    root.style.setProperty('--muted', hexA(r.textColor, 0.62));
    root.style.setProperty('--line', hexA(r.textColor, 0.13));
    root.style.setProperty('--card', hexA(r.textColor, r.themeMode === 'light' ? 0.04 : 0.045));
    root.style.setProperty('--card-strong', hexA(r.textColor, r.themeMode === 'light' ? 0.08 : 0.08));
    root.style.setProperty('--on-accent', readableOn(r.accentColor));
    root.style.setProperty('--radius', r.buttonStyle === 'square' ? '6px' : r.buttonStyle === 'pill' ? '22px' : '16px');
    document.body.style.background = r.surfaceColor;
    document.body.style.color = r.textColor;
  }, [r]);

  // restore language from session
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('sm_lang') : null;
    if (saved === 'en' || saved === 'fr') setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { sessionStorage.setItem('sm_lang', l); } catch {}
    track('language_changed', { meta: { lang: l } });
  };

  const t = useMemo(() => makeT(lang), [lang]);

  const L = (o: any) => ({
    name: lang === 'fr' && o.nameFr ? o.nameFr : o.name,
    description: (lang === 'fr' && o.descriptionFr ? o.descriptionFr : o.description) ?? null,
  });

  const track: GuestCtx['track'] = (event, opts) => {
    try {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          restaurantId: r.id,
          sessionId: data.sessionId,
          tableId: data.table.id,
          event,
          ...opts,
        }),
      });
    } catch {}
  };

  const value: GuestCtx = { data, lang, setLang, t, L, track };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// hex + alpha → rgba()
function hexA(hex: string, a: number) {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
