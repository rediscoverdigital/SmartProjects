'use client';

import { useState, useTransition, useEffect } from 'react';
import { createTable, createLocation, suspendObject, replaceObject } from '@/app/actions/dashboard';
import { StatusPill, SectionHeading, Empty } from './ui';
import { Plus, QrCode, Nfc, X, Loader2, MapPin, RefreshCw, Ban, ExternalLink, Copy, Check } from 'lucide-react';

type Obj = {
  id: string; publicCode: string; nfcUid: string | null; objectType: string;
  status: string; lastScanAt: string | null; scanCount: number;
};
type Table = {
  id: string; label: string; seats: number | null; status: string;
  locationId: string | null; locationName: string | null; objects: Obj[];
};
type Loc = { id: string; name: string; kind: string };

export function TablesBoard({ tables, locations }: { tables: Table[]; locations: Loc[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showLoc, setShowLoc] = useState(false);
  const [detail, setDetail] = useState<Table | null>(null);
  const [pending, start] = useTransition();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.5rem]">Tables &amp; objects</h1>
          <p className="text-[0.82rem] text-black/45">
            {tables.length} tables · {tables.reduce((n, t) => n + t.objects.length, 0)} NFC/QR objects
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLoc(true)} className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[0.82rem] font-medium transition hover:border-black/20">
            <MapPin className="h-3.5 w-3.5" /> Add location
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-4 py-2.5 text-[0.82rem] font-semibold text-white transition hover:bg-black active:scale-[0.98]">
            <Plus className="h-4 w-4" /> Add table
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="dash-card">
          <Empty icon={QrCode} title="No tables yet" body="Add a table to provision its NFC/QR object automatically." />
        </div>
      ) : (
        <div className="dash-card overflow-hidden">
          <table className="w-full text-left text-[0.85rem]">
            <thead>
              <tr className="border-b border-black/[0.06] text-[0.68rem] uppercase tracking-wider text-black/40">
                <th className="px-4 py-3 font-semibold">Table</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Location</th>
                <th className="px-4 py-3 font-semibold">NFC</th>
                <th className="px-4 py-3 font-semibold">QR</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Scans</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Last scan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {tables.map((t) => {
                const obj = t.objects.find((o) => o.status === 'active') || t.objects[0];
                const hasNfc = !!obj?.nfcUid;
                const last = obj?.lastScanAt ? ago(obj.lastScanAt) : 'Never';
                return (
                  <tr key={t.id} onClick={() => setDetail(t)} className="cursor-pointer transition hover:bg-black/[0.02]">
                    <td className="px-4 py-3">
                      <span className="font-semibold">{t.label}</span>
                      {t.seats && <span className="ml-2 text-[0.72rem] text-black/40">{t.seats} seats</span>}
                    </td>
                    <td className="hidden px-4 py-3 text-black/55 sm:table-cell">{t.locationName ?? '—'}</td>
                    <td className="px-4 py-3">{hasNfc ? <Check className="h-4 w-4 text-[#4F5C46]" /> : <span className="text-black/25">—</span>}</td>
                    <td className="px-4 py-3">
                      {obj ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[0.78rem] text-black/70">
                          <QrCode className="h-3.5 w-3.5" /> {obj.publicCode}
                        </span>
                      ) : <span className="text-black/25">—</span>}
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums text-black/60 md:table-cell">{obj?.scanCount ?? 0}</td>
                    <td className="hidden px-4 py-3 text-black/50 md:table-cell">{last}</td>
                    <td className="px-4 py-3"><StatusPill status={obj?.status ?? t.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddTableDrawer locations={locations} onClose={() => setShowAdd(false)} />}
      {showLoc && <AddLocationDrawer onClose={() => setShowLoc(false)} />}
      {detail && <ObjectDetail table={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function AddTableDrawer({ locations, onClose }: { locations: Loc[]; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <Drawer title="Add table" onClose={onClose}>
      <form
        action={(fd) => start(async () => {
          const res = await createTable(fd);
          if (res?.error) setErr(res.error); else onClose();
        })}
        className="space-y-4"
      >
        <Field label="Table number / label"><input name="label" required placeholder="Table 12" className={inputCls} /></Field>
        <Field label="Location">
          <select name="locationId" className={inputCls}>
            <option value="">—</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Seats"><input name="seats" type="number" placeholder="4" className={inputCls} /></Field>
          <Field label="Object type">
            <select name="objectType" className={inputCls}>
              <option value="table_number">Table number</option>
              <option value="plaque">Table plaque</option>
              <option value="menu_stand">Menu stand</option>
              <option value="counter">Counter display</option>
              <option value="menu_cover">Menu cover</option>
            </select>
          </Field>
        </div>
        <p className="rounded-xl bg-black/[0.03] px-3.5 py-3 text-[0.75rem] leading-relaxed text-black/50">
          A unique opaque public code will be generated automatically. Program your NTAG215/216 with{' '}
          <span className="font-mono">/t/&lt;code&gt;</span> — the same code drives the QR fallback.
        </p>
        {err && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[0.82rem] text-red-700">{err}</p>}
        <DrawerActions onClose={onClose} pending={pending} label="Create table" />
      </form>
    </Drawer>
  );
}

function AddLocationDrawer({ onClose }: { onClose: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <Drawer title="Add location" onClose={onClose}>
      <form action={(fd) => start(async () => { const r = await createLocation(fd); if (r?.error) setErr(r.error); else onClose(); })} className="space-y-4">
        <Field label="Name"><input name="name" required placeholder="Sea Terrace" className={inputCls} /></Field>
        <Field label="Kind">
          <select name="kind" className={inputCls}>
            <option value="room">Room</option>
            <option value="floor">Floor</option>
            <option value="terrace">Terrace</option>
            <option value="takeaway">Takeaway</option>
          </select>
        </Field>
        {err && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[0.82rem] text-red-700">{err}</p>}
        <DrawerActions onClose={onClose} pending={pending} label="Create location" />
      </form>
    </Drawer>
  );
}

function ObjectDetail({ table, onClose }: { table: Table; onClose: () => void }) {
  const [pending, start] = useTransition();
  const [replacing, setReplacing] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const obj = table.objects.find((o) => o.status === 'active') || table.objects[0];
  const url = obj ? `${typeof window !== 'undefined' ? window.location.origin : ''}/t/${obj.publicCode}` : '';

  const copy = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Drawer title={table.label} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">Physical object</p>
          <div className="mt-3 space-y-2.5 text-[0.85rem]">
            <Row k="Object ID" v={obj?.publicCode ?? '—'} mono />
            <Row k="Type" v={(obj?.objectType ?? '').replace('_', ' ')} />
            <Row k="NFC UID" v={obj?.nfcUid ?? 'Not programmed'} mono />
            <Row k="Assigned to" v={table.label} />
            <Row k="Location" v={table.locationName ?? '—'} />
            <Row k="Status" v={obj?.status ?? '—'} />
            <Row k="Scans" v={String(obj?.scanCount ?? 0)} />
            <Row k="Last scan" v={obj?.lastScanAt ? ago(obj.lastScanAt) : 'Never'} />
          </div>
        </div>

        {/* QR */}
        {obj && (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-4 text-center">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">QR / NFC target</p>
            <div className="mt-3 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(url)}`}
                alt={`QR code for ${table.label}`}
                width={180}
                height={180}
                className="rounded-xl border border-black/10"
              />
            </div>
            <p className="mt-3 break-all font-mono text-[0.72rem] text-black/50">{url}</p>
            <button onClick={copy} className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-[0.78rem] font-semibold transition hover:border-black/25">
              {copied ? <Check className="h-3.5 w-3.5 text-[#4F5C46]" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy URL'}
            </button>
          </div>
        )}

        {newCode && (
          <p className="rounded-xl bg-[#7E8F72]/12 px-3.5 py-3 text-[0.8rem] text-[#4F5C46]">
            Tag replaced. New object <span className="font-mono font-bold">{newCode}</span> is active. Table history is preserved.
          </p>
        )}

        {replacing ? (
          <form
            action={(fd) => start(async () => {
              fd.set('oldId', obj.id);
              const res = await replaceObject(fd);
              if (res?.ok) { setNewCode(res.newCode!); setReplacing(false); }
            })}
            className="rounded-2xl border border-black/[0.06] bg-white p-4"
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">Replace tag</p>
            <p className="mt-2 text-[0.78rem] leading-relaxed text-black/50">
              The old tag becomes “replaced”. Historical analytics stay associated with {table.label}.
            </p>
            <div className="mt-3 space-y-3">
              <Field label="New public code (blank = auto-generate)"><input name="newCode" placeholder="e.g. 8F42K" className={inputCls} /></Field>
              <Field label="New NFC UID (optional)"><input name="nfcUid" placeholder="04:A2:…" className={inputCls} /></Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setReplacing(false)} className="rounded-full border border-black/10 px-4 py-2 text-[0.8rem] font-semibold">Cancel</button>
              <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-5 py-2 text-[0.8rem] font-semibold text-white">
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Confirm replacement
              </button>
            </div>
          </form>
        ) : (
          obj && (
            <div className="flex gap-2">
              <button onClick={() => setReplacing(true)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-black/10 bg-white py-2.5 text-[0.82rem] font-semibold transition hover:border-black/25">
                <RefreshCw className="h-3.5 w-3.5" /> Replace tag
              </button>
              <button
                onClick={() => start(async () => { await suspendObject(obj.id); })}
                disabled={pending}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-black/10 bg-white py-2.5 text-[0.82rem] font-semibold transition hover:border-red-200 hover:text-red-600"
              >
                <Ban className="h-3.5 w-3.5" /> {obj.status === 'active' ? 'Suspend' : 'Reactivate'}
              </button>
            </div>
          )
        )}
      </div>
    </Drawer>
  );
}

// ── shared drawer ──────────────────────────────────────────
function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-[480px] flex-col bg-[#f6f5f1] anim-in">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="font-display text-[1.2rem]">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-black/[0.05]"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function DrawerActions({ onClose, pending, label }: { onClose: () => void; pending: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-[0.85rem] font-semibold">Cancel</button>
      <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-6 py-2.5 text-[0.85rem] font-semibold text-white disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} {label}
      </button>
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
function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-black/45">{k}</span>
      <span className={`text-right font-medium capitalize ${mono ? 'font-mono normal-case' : ''}`}>{v}</span>
    </div>
  );
}
function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}
