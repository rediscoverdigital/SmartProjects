'use client';

import { useState, useTransition } from 'react';
import { saveItem, toggleAvailability, deleteItem, duplicateItem, saveCategory } from '@/app/actions/menu';
import { StatusPill, SectionHeading, Empty } from './ui';
import {
  Plus, Search, Pencil, Copy, Trash2, Eye, Star, X, Loader2, Check, FolderPlus, ExternalLink, Sparkles,
} from 'lucide-react';
import Link from 'next/link';

type Cat = { id: string; name: string; nameFr: string | null; icon: string | null; displayOrder: number; visible: boolean };
type Item = any;

const SPICE = ['none', 'mild', 'medium', 'hot'];
const STATUS = ['available', 'sold_out', 'hidden', 'coming_soon'];
const ALLERGENS = ['gluten', 'dairy', 'egg', 'nuts', 'peanuts', 'sesame', 'soy', 'fish', 'shellfish', 'crustacean', 'mollusc', 'mustard', 'celery', 'alcohol', 'sulphites'];
const DIET = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Halal', 'Seafood', 'Spicy'];

export function MenuCMS({
  restaurantName, currency, categories, items, guestCode,
}: {
  restaurantName: string;
  currency: string;
  categories: Cat[];
  items: Item[];
  guestCode: string | null;
}) {
  const [tab, setTab] = useState<'items' | 'categories'>('items');
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [pending, start] = useTransition();

  const filtered = items.filter((i) => {
    if (filterCat !== 'all' && i.categoryId !== filterCat) return false;
    if (query && !`${i.name} ${i.nameFr || ''}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const grouped = categories
    .map((c) => ({ cat: c, items: filtered.filter((i) => i.categoryId === c.id) }))
    .filter((g) => g.items.length || filterCat === g.cat.id);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.5rem]">Menu</h1>
          <p className="text-[0.82rem] text-black/45">{items.length} items · {categories.length} categories · changes appear instantly</p>
        </div>
        <div className="flex items-center gap-2">
          {guestCode && (
            <Link href={`/t/${guestCode}`} target="_blank" className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[0.82rem] font-medium transition hover:border-black/20">
              <Eye className="h-3.5 w-3.5" /> Preview menu
            </Link>
          )}
          <button
            onClick={() => { setCreating(true); setEditing(null); }}
            className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-4 py-2.5 text-[0.82rem] font-semibold text-white transition hover:bg-black active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>
      </div>

      {/* tabs + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-black/10 bg-white p-0.5">
          {(['items', 'categories'] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`rounded-full px-4 py-1.5 text-[0.8rem] font-semibold capitalize transition ${tab === tb ? 'bg-[#0c0c0c] text-white' : 'text-black/55'}`}
            >
              {tb}
            </button>
          ))}
        </div>
        {tab === 'items' && (
          <>
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items…"
                className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-[0.85rem] outline-none focus:border-black/25"
              />
            </div>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-[0.82rem] outline-none"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* CATEGORIES TAB */}
      {tab === 'categories' && <CategoriesTab categories={categories} itemCount={(id) => items.filter((i) => i.categoryId === id).length} />}

      {/* ITEMS TAB */}
      {tab === 'items' && (
        <>
          {grouped.length === 0 ? (
            <div className="dash-card">
              <Empty title="No menu items yet" body="Add your first dish to get started." action={
                <button onClick={() => setCreating(true)} className="rounded-full bg-[#0c0c0c] px-5 py-2.5 text-[0.82rem] font-semibold text-white">Add item</button>
              } />
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((g) => (
                <div key={g.cat.id}>
                  <div className="mb-2.5 flex items-center gap-2">
                    {g.cat.icon && <span>{g.cat.icon}</span>}
                    <h2 className="font-display text-[1.1rem]">{g.cat.name}</h2>
                    <span className="text-[0.72rem] text-black/40">{g.items.length} items</span>
                    {!g.cat.visible && <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[0.62rem] font-bold uppercase text-black/50">Hidden</span>}
                  </div>
                  <div className="dash-card divide-y divide-black/[0.05] overflow-hidden">
                    {g.items.map((it) => (
                      <ItemRow
                        key={it.id}
                        item={it}
                        catName={catName(it.categoryId)}
                        currency={currency}
                        onEdit={() => { setEditing(it); setCreating(false); }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* editor drawer */}
      {(editing || creating) && (
        <ItemEditor
          item={editing}
          categories={categories}
          currency={currency}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

function ItemRow({ item, catName, currency, onEdit }: { item: Item; catName: string; currency: string; onEdit: () => void }) {
  const [pending, start] = useTransition();
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/[0.05]">
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[0.88rem] font-semibold">{item.name}</p>
          {item.isSpecial && <Star className="h-3.5 w-3.5 shrink-0 text-[#8E7642]" fill="currentColor" />}
        </div>
        <p className="truncate text-[0.72rem] text-black/40">{item.nameFr || catName}</p>
      </div>
      <span className="hidden font-display text-[0.95rem] tabular-nums sm:block">Rs {item.price.toLocaleString('en-US')}</span>
      <button
        onClick={() => start(async () => { await toggleAvailability(item.id, item.status); })}
        disabled={pending}
        title="Toggle availability"
        className="shrink-0"
      >
        <StatusPill status={item.status} />
      </button>
      <div className="flex items-center gap-1">
        <button onClick={onEdit} className="rounded-lg p-2 text-black/40 transition hover:bg-black/[0.05] hover:text-black" title="Edit">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => start(async () => { await duplicateItem(item.id); })} disabled={pending} className="rounded-lg p-2 text-black/40 transition hover:bg-black/[0.05] hover:text-black" title="Duplicate">
          <Copy className="h-3.5 w-3.5" />
        </button>
        {confirmDel ? (
          <div className="flex items-center gap-1">
            <button onClick={() => start(async () => { await deleteItem(item.id); })} disabled={pending} className="rounded-lg p-2 text-red-600" title="Confirm">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setConfirmDel(false)} className="rounded-lg p-2 text-black/40" title="Cancel">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)} className="rounded-lg p-2 text-black/40 transition hover:bg-red-50 hover:text-red-600" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ItemEditor({ item, categories, currency, onClose }: { item: Item | null; categories: Cat[]; currency: string; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [image, setImage] = useState<string>(item?.image || '');
  const [allergens, setAllergens] = useState<string[]>(item?.allergens ? item.allergens.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
  const [diet, setDiet] = useState<string[]>(item?.dietaryTags ? item.dietaryTags.split(',').map((s: string) => s.trim()).filter(Boolean) : []);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const submit = (formData: FormData) => {
    formData.set('allergens', allergens.join(', '));
    formData.set('dietaryTags', diet.join(', '));
    formData.set('image', image);
    start(async () => {
      const res = await saveItem(formData);
      if (res?.error) setErr(res.error);
      else onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form action={submit} className="relative z-10 flex h-full w-full max-w-[560px] flex-col bg-[#f6f5f1] anim-in">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="font-display text-[1.2rem]">{item ? 'Edit item' : 'New item'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-black/[0.05]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {item && <input type="hidden" name="id" value={item.id} />}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name (EN)"><input name="name" defaultValue={item?.name} required className={inputCls} /></Field>
            <Field label="Name (FR)"><input name="nameFr" defaultValue={item?.nameFr} className={inputCls} /></Field>
          </div>

          <Field label="Description (EN)"><textarea name="description" defaultValue={item?.description} rows={2} className={inputCls} /></Field>
          <Field label="Description (FR)"><textarea name="descriptionFr" defaultValue={item?.descriptionFr} rows={2} className={inputCls} /></Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Category">
              <select name="categoryId" defaultValue={item?.categoryId || categories[0]?.id} className={inputCls}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label={`Price (${currency})`}><input name="price" type="number" step="1" defaultValue={item?.price ?? 0} required className={inputCls} /></Field>
            <Field label="Prep (min)"><input name="prepMinutes" type="number" defaultValue={item?.prepMinutes ?? ''} className={inputCls} /></Field>
          </div>

          <Field label="Image URL">
            <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" className={inputCls} />
          </Field>
          {image && (
            <div className="h-32 w-full overflow-hidden rounded-xl border border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="h-full w-full object-cover" onError={(e) => ((e.target as any).style.display = 'none')} />
            </div>
          )}

          <Field label="Ingredients (comma-separated)"><input name="ingredients" defaultValue={item?.ingredients} className={inputCls} /></Field>

          <Field label="Allergens">
            <div className="flex flex-wrap gap-1.5">
              {ALLERGENS.map((a) => (
                <button key={a} type="button" onClick={() => toggle(allergens, setAllergens, a)}
                  className={`rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold capitalize transition ${allergens.includes(a) ? 'border-[#C25E1E] bg-[#C25E1E]/10 text-[#C25E1E]' : 'border-black/10 bg-white text-black/50'}`}>
                  {a}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Dietary tags">
            <div className="flex flex-wrap gap-1.5">
              {DIET.map((d) => (
                <button key={d} type="button" onClick={() => toggle(diet, setDiet, d)}
                  className={`rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold transition ${diet.includes(d) ? 'border-[#7E8F72] bg-[#7E8F72]/12 text-[#4F5C46]' : 'border-black/10 bg-white text-black/50'}`}>
                  {d}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Spice level">
              <select name="spiceLevel" defaultValue={item?.spiceLevel || 'none'} className={inputCls}>
                {SPICE.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={item?.status || 'available'} className={inputCls}>
                {STATUS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </Field>
          </div>

          <Field label="AI note (the assistant may quote this verbatim)">
            <textarea name="aiNote" defaultValue={item?.aiNote} rows={2} className={inputCls} placeholder="e.g. Our vegetarian signature — rich but not heavy." />
          </Field>

          <div className="flex flex-wrap gap-4">
            <Toggle name="isSpecial" label="Special" defaultChecked={item?.isSpecial} />
            <Toggle name="recommended" label="Recommended" defaultChecked={item?.recommended} />
            <Toggle name="featured" label="Featured" defaultChecked={item?.featured} />
          </div>

          {err && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[0.82rem] text-red-700">{err}</p>}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-black/[0.06] px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-[0.85rem] font-semibold">Cancel</button>
          <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-6 py-2.5 text-[0.85rem] font-semibold text-white disabled:opacity-60">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {item ? 'Save item' : 'Create item'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CategoriesTab({ categories, itemCount }: { categories: Cat[]; itemCount: (id: string) => number }) {
  const [editing, setEditing] = useState<Cat | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="dash-card lg:col-span-2">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
          <h2 className="font-display text-[1.05rem]">Categories</h2>
          <button onClick={() => { setCreating(true); setEditing(null); }} className="flex items-center gap-1.5 rounded-full bg-[#0c0c0c] px-3.5 py-2 text-[0.78rem] font-semibold text-white">
            <FolderPlus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        <div className="divide-y divide-black/[0.05]">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg">{c.icon || '·'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.88rem] font-semibold">{c.name}</p>
                <p className="text-[0.72rem] text-black/40">{c.nameFr || '—'} · order {c.displayOrder}</p>
              </div>
              <span className="text-[0.75rem] text-black/45">{itemCount(c.id)} items</span>
              {!c.visible && <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[0.62rem] font-bold uppercase text-black/50">Hidden</span>}
              <button onClick={() => { setEditing(c); setCreating(false); }} className="rounded-lg p-2 text-black/40 hover:bg-black/[0.05] hover:text-black">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {(editing || creating) && (
        <form
          action={(fd) => start(async () => { await saveCategory(fd); setEditing(null); setCreating(false); })}
          className="dash-card h-fit p-5"
        >
          <h3 className="font-display text-[1.05rem]">{editing ? 'Edit category' : 'New category'}</h3>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="mt-4 space-y-3.5">
            <Field label="Name (EN)"><input name="name" defaultValue={editing?.name} required className={inputCls} /></Field>
            <Field label="Name (FR)"><input name="nameFr" defaultValue={editing?.nameFr ?? undefined} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Icon (emoji)"><input name="icon" defaultValue={editing?.icon ?? undefined} placeholder="🍽️" className={inputCls} /></Field>
              <Field label="Display order"><input name="displayOrder" type="number" defaultValue={editing?.displayOrder ?? categories.length + 1} className={inputCls} /></Field>
            </div>
            <Toggle name="visible" label="Visible on menu" defaultChecked={editing?.visible ?? true} />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => { setEditing(null); setCreating(false); }} className="rounded-full border border-black/10 bg-white px-4 py-2 text-[0.82rem] font-semibold">Cancel</button>
            <button type="submit" disabled={pending} className="rounded-full bg-[#0c0c0c] px-5 py-2 text-[0.82rem] font-semibold text-white">Save</button>
          </div>
        </form>
      )}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition focus:border-black/30';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wide text-black/45">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-[0.85rem]">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-black/20 accent-[#0c0c0c]" />
      {label}
    </label>
  );
}
