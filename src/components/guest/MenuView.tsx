'use client';

import { useMemo, useState, useEffect } from 'react';
import { useGuest } from './GuestProvider';
import { Search, SlidersHorizontal, X, Plus, Check, Star } from 'lucide-react';
import type { CartLine } from './types';
import { Tag, SpiceMeter } from './ui';

const DIET_FILTERS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Halal'];
const OTHER_FILTERS = ['Spicy', 'Recommended'];

export function MenuView({
  openItem,
  cart,
  addToCart,
}: {
  openItem: (id: string) => void;
  cart: CartLine[];
  addToCart: (id: string, qty?: number) => void;
}) {
  const { data, t, L, track } = useGuest();
  const [activeCat, setActiveCat] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const cats = data.categories;
  const visible = useMemo(() => data.items.filter((i) => i.status !== 'hidden'), [data.items]);

  const filtered = useMemo(() => {
    let list = visible;
    if (activeCat !== 'all') list = list.filter((i) => i.categoryId === activeCat);
    if (query.trim()) {
      const q = norm(query);
      list = list.filter((i) =>
        norm(`${i.name} ${i.nameFr || ''} ${i.description || ''} ${i.descriptionFr || ''} ${i.ingredients || ''} ${i.dietaryTags || ''}`).includes(q),
      );
    }
    if (filters.length) {
      list = list.filter((i) => {
        const tags = norm(`${i.dietaryTags || ''}`);
        const nameDesc = norm(`${i.name} ${i.description || ''} ${i.nameFr || ''} ${i.descriptionFr || ''}`);
        return filters.every((f) => {
          const nf = norm(f);
          if (nf === 'spicy') return i.spiceLevel === 'medium' || i.spiceLevel === 'hot' || tags.includes('spicy');
          if (nf === 'recommended') return i.recommended || i.isSpecial;
          if (nf === 'gluten-free') return tags.includes('gluten-free') || tags.includes('sans gluten');
          if (nf === 'dairy-free') return tags.includes('dairy-free') || tags.includes('sans lactose');
          return tags.includes(nf) || nameDesc.includes(nf);
        });
      });
    }
    return list;
  }, [visible, activeCat, query, filters]);

  // group by category for the "all" view
  const grouped = useMemo(() => {
    if (activeCat !== 'all' || query.trim() || filters.length) return null;
    return cats
      .map((c) => ({ cat: c, items: visible.filter((i) => i.categoryId === c.id) }))
      .filter((g) => g.items.length);
  }, [cats, visible, activeCat, query, filters]);

  useEffect(() => {
    if (query.trim().length > 1) {
      const id = setTimeout(() => track('search_completed', { entityLabel: query }), 800);
      return () => clearTimeout(id);
    }
  }, [query, track]);

  const cartQty = (id: string) => cart.find((l) => l.itemId === id)?.qty ?? 0;

  return (
    <div className="anim-in">
      {/* search */}
      <div className="sticky top-[57px] z-20 px-4 pb-3 pt-3 backdrop-blur-xl" style={{ background: 'color-mix(in srgb, var(--surface) 88%, transparent)' }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length === 1) track('search_started');
              }}
              placeholder={t('menu.search')}
              className="w-full rounded-xl border py-3 pl-10 pr-9 text-[0.9rem] outline-none transition focus:border-[var(--brand-2)]"
              style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
              aria-label={t('menu.search')}
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="clear">
                <X className="h-4 w-4" style={{ color: 'var(--muted)' }} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border transition"
            style={{
              borderColor: filters.length ? 'var(--brand-2)' : 'var(--line)',
              background: filters.length ? 'var(--brand-2)' : 'var(--card)',
              color: filters.length ? 'var(--on-accent, #0a0f16)' : 'var(--ink)',
            }}
            aria-label="filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {filters.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[0.6rem] font-bold" style={{ background: 'var(--surface)', color: 'var(--brand-2)' }}>
                {filters.length}
              </span>
            )}
          </button>
        </div>

        {/* category chips */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
          <Chip active={activeCat === 'all'} onClick={() => setActiveCat('all')}>
            {t('menu.all')}
          </Chip>
          {cats.map((c) => (
            <Chip key={c.id} active={activeCat === c.id} onClick={() => { setActiveCat(c.id); track('category_viewed', { entityType: 'category', entityId: c.id, entityLabel: c.name }); }}>
              {c.icon ? `${c.icon} ` : ''}{useGuest().lang === 'fr' && c.nameFr ? c.nameFr : c.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* filter panel */}
      {showFilters && (
        <div className="anim-in mx-4 mb-3 rounded-2xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
          <p className="eyebrow" style={{ color: 'var(--muted)' }}>{t('menu.dietary')}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {DIET_FILTERS.map((f) => (
              <Chip key={f} active={filters.includes(f)} onClick={() => toggle(f)}>
                {filters.includes(f) && <Check className="h-3 w-3" />} {f}
              </Chip>
            ))}
          </div>
          <p className="eyebrow mt-4" style={{ color: 'var(--muted)' }}>Other</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {OTHER_FILTERS.map((f) => (
              <Chip key={f} active={filters.includes(f)} onClick={() => toggle(f)}>
                {filters.includes(f) && <Check className="h-3 w-3" />} {f}
              </Chip>
            ))}
          </div>
          {filters.length > 0 && (
            <button onClick={() => setFilters([])} className="mt-4 text-[0.78rem] font-semibold" style={{ color: 'var(--brand-2)' }}>
              {t('menu.all')} — clear filters
            </button>
          )}
        </div>
      )}

      {/* results */}
      {query.trim() && (
        <p className="px-5 pb-2 text-[0.8rem]" style={{ color: 'var(--muted)' }}>
          {filtered.length} {filtered.length === 1 ? 'dish' : 'dishes'} · “{query}”
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState query={query} />
      ) : grouped ? (
        <div className="space-y-8 px-5 pt-2">
          {grouped.map((g) => (
            <section key={g.cat.id}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl" style={{ color: 'var(--ink)' }}>
                {g.cat.icon && <span>{g.cat.icon}</span>}
                {useGuest().lang === 'fr' && g.cat.nameFr ? g.cat.nameFr : g.cat.name}
              </h2>
              <div className="space-y-3">
                {g.items.map((it) => (
                  <MenuCard key={it.id} item={it} onOpen={() => openItem(it.id)} onAdd={() => addToCart(it.id)} qty={cartQty(it.id)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-3 px-5 pt-2">
          {filtered.map((it) => (
            <MenuCard key={it.id} item={it} onOpen={() => openItem(it.id)} onAdd={() => addToCart(it.id)} qty={cartQty(it.id)} />
          ))}
        </div>
      )}

      <div className="h-6" />
    </div>
  );

  function toggle(f: string) {
    setFilters((prev) => {
      const next = prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f];
      track('filter_used', { entityLabel: f });
      return next;
    });
  }
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-[0.78rem] font-semibold transition active:scale-95"
      style={
        active
          ? { background: 'var(--brand-2)', borderColor: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }
          : { borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--muted)' }
      }
    >
      {children}
    </button>
  );
}

function MenuCard({ item, onOpen, onAdd, qty }: { item: any; onOpen: () => void; onAdd: () => void; qty: number }) {
  const { t, L } = useGuest();
  const l = L(item);
  const soldOut = item.status === 'sold_out';
  const soon = item.status === 'coming_soon';

  return (
    <div
      className="group relative flex gap-3.5 overflow-hidden rounded-2xl border p-2.5 transition"
      style={{ borderColor: 'var(--line)', background: 'var(--card)', opacity: soldOut || soon ? 0.62 : 1 }}
    >
      <button onClick={onOpen} className="h-[92px] w-[92px] shrink-0 overflow-hidden rounded-xl" aria-label={l.name}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" className="img-zoom h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: 'var(--card-strong)' }} />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <button onClick={onOpen} className="text-left">
          <div className="flex items-start gap-1.5">
            <h3 className="font-display text-[1.02rem] leading-tight" style={{ color: 'var(--ink)' }}>
              {l.name}
            </h3>
            {item.isSpecial && <Star className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: 'var(--brand-2)' }} fill="currentColor" />}
          </div>
          {l.description && (
            <p className="clamp-2 mt-1 text-[0.78rem] leading-snug" style={{ color: 'var(--muted)' }}>
              {l.description}
            </p>
          )}
        </button>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-[1.02rem]" style={{ color: 'var(--brand-2)' }}>
                Rs {item.price.toLocaleString('en-US')}
              </span>
              <SpiceMeter level={item.spiceLevel} />
            </div>
            {item.dietaryTags && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {item.dietaryTags.split(',').slice(0, 3).map((tg: string) => (
                  <Tag key={tg} label={tg.trim()} />
                ))}
              </div>
            )}
          </div>

          {soldOut ? (
            <span className="shrink-0 rounded-full border px-2.5 py-1 text-[0.64rem] font-bold uppercase tracking-wide" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
              {t('menu.soldOut')}
            </span>
          ) : soon ? (
            <span className="shrink-0 rounded-full border px-2.5 py-1 text-[0.64rem] font-bold uppercase tracking-wide" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
              {t('menu.comingSoon')}
            </span>
          ) : (
            <button
              onClick={onAdd}
              className="flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[0.72rem] font-bold transition active:scale-95"
              style={{ background: qty > 0 ? 'var(--brand-2)' : 'var(--card-strong)', color: qty > 0 ? 'var(--on-accent, #0a0f16)' : 'var(--ink)', border: '1px solid var(--line)' }}
              aria-label={`${t('menu.addToOrder')} ${l.name}`}
            >
              {qty > 0 ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {qty > 0 ? qty : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  const { t } = useGuest();
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <span className="text-3xl">🍽️</span>
      <p className="mt-4 font-display text-lg" style={{ color: 'var(--ink)' }}>
        {t('menu.noResults')}
      </p>
      <p className="mt-1.5 text-[0.85rem]" style={{ color: 'var(--muted)' }}>
        {t('menu.noResultsHint')}
      </p>
    </div>
  );
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
