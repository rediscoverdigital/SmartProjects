'use client';

import { useState, useTransition, useRef } from 'react';
import { saveBranding, uploadLogo } from '@/app/actions/dashboard';
import { SectionHeading } from './ui';
import { Loader2, Check, Palette, Store, ToggleRight, ExternalLink, Upload, X, Image } from 'lucide-react';
import Link from 'next/link';

const THEMES = [
  { name: 'Ink & Brass', primary: '#0C1824', accent: '#C0A86C', surface: '#0A0F16', text: '#F4F1E8', mode: 'dark' },
  { name: 'Ember', primary: '#180C0C', accent: '#D9762F', surface: '#120807', text: '#F5EDE6', mode: 'dark' },
  { name: 'Sage Cream', primary: '#3E4A38', accent: '#7E8F72', surface: '#FBFBF6', text: '#2A2E27', mode: 'light' },
  { name: 'Midnight', primary: '#101418', accent: '#8FA8C8', surface: '#0B0E12', text: '#EEF1F5', mode: 'dark' },
  { name: 'Terracotta', primary: '#3A1F17', accent: '#C97B5A', surface: '#1A0F0B', text: '#F7EDE7', mode: 'dark' },
];

export function BrandingForm({ data, guestCode }: { data: any; guestCode: string | null }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [primary, setPrimary] = useState(data.primaryColor);
  const [accent, setAccent] = useState(data.accentColor);
  const [surface, setSurface] = useState(data.surfaceColor);
  const [text, setText] = useState(data.textColor);
  const [mode, setMode] = useState(data.themeMode);
  const [buttonStyle, setButtonStyle] = useState(data.buttonStyle);
  const [cover, setCover] = useState(data.coverImage || '');
  const [name, setName] = useState(data.name);
  const [logo, setLogo] = useState(data.logo || '');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoInputKey, setLogoInputKey] = useState(0);
  const [customizing, setCustomizing] = useState(false); // tracks if user has deviated from a preset
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);

  const applyTheme = (t: typeof THEMES[number]) => {
    setPrimary(t.primary); setAccent(t.accent); setSurface(t.surface); setText(t.text); setMode(t.mode);
    setCustomizing(false);
  };

  const updateColor = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setCustomizing(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.5rem]">Branding &amp; settings</h1>
          <p className="text-[0.82rem] text-black/45">How your guest experience looks and behaves</p>
        </div>
        {guestCode && (
          <Link href={`/t/${guestCode}`} target="_blank" className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[0.82rem] font-medium transition hover:border-black/20">
            <ExternalLink className="h-3.5 w-3.5" /> Preview live
          </Link>
        )}
      </div>

      <form
        action={(fd) => start(async () => { await saveBranding(fd); setSaved(true); setTimeout(() => setSaved(false), 2000); })}
        className="grid gap-5 lg:grid-cols-3"
      >
        <div className="space-y-5 lg:col-span-2">
          {/* profile */}
          <div className="dash-card p-5">
            <SectionHeading title="Restaurant profile" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input name="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
              <Field label="Logo text"><input name="logoText" defaultValue={data.logoText ?? ''} className={inputCls} /></Field>
              <Field label="Logo image (PNG)" full>
                <div className="space-y-2">
                  <input type="hidden" name="logo" value={logo} />
                  {logo ? (
                    <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo} alt="Logo preview" className="h-12 w-12 rounded-lg object-contain" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.78rem] font-medium">{logo.split('/').pop()}</p>
                        <p className="text-[0.68rem] text-black/40">Logo is live on the guest experience</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLogo('')}
                        className="rounded-lg p-1.5 text-black/40 transition hover:bg-red-50 hover:text-red-600"
                        title="Remove logo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-black/20 bg-white px-4 py-3 text-[0.82rem] font-medium text-black/60 transition hover:border-black/40 hover:text-black">
                        <Upload className="h-4 w-4" />
                        <span>Upload PNG logo</span>
                        <input
                          key={logoInputKey}
                          type="file"
                          accept="image/png"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setLogoError(null);
                            setLogoUploading(true);
                            const fd = new FormData();
                            fd.append('logo', file);
                            const res = await uploadLogo(fd);
                            setLogoUploading(false);
                            if (res?.error) {
                              setLogoError(res.error);
                            } else if (res?.logo) {
                              setLogo(res.logo);
                              setLogoInputKey((k) => k + 1);
                            }
                          }}
                        />
                      </label>
                      {logoUploading && <Loader2 className="h-4 w-4 animate-spin text-black/40" />}
                    </div>
                  )}
                  {logoError && <p className="rounded-lg bg-red-50 px-3 py-2 text-[0.75rem] text-red-700">{logoError}</p>}
                  <p className="text-[0.68rem] text-black/35">PNG only, max 5 MB. Recommended: square or wide format with transparent background.</p>
                </div>
              </Field>
              <Field label="Tagline" full><input name="tagline" defaultValue={data.tagline ?? ''} className={inputCls} /></Field>
              <Field label="Welcome message" full><textarea name="welcomeMsg" defaultValue={data.welcomeMsg ?? ''} rows={2} className={inputCls} /></Field>
              {/* Cover / Hero image uploader */}
              <div className="space-y-3">
                <label className="block text-[0.7rem] font-semibold uppercase tracking-wide text-black/45">Cover image</label>
                <input type="hidden" name="coverImage" value={cover} />
                {cover ? (
                  <div className="relative">
                    <img src={cover} alt="Cover preview" className="h-20 w-full rounded-xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setCover('')}
                      className="absolute top-1.5 right-1.5 rounded-lg bg-black/50 p-1 text-white/80 transition hover:bg-black/70"
                      title="Remove cover image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 bg-black/[0.03] px-4 py-6 text-center transition hover:border-black/30"
                    onClick={() => heroInputRef.current?.click()}
                  >
                    <Image className="h-4 w-4 text-black/45" />
                    <span className="text-[0.8rem] font-medium">{heroUploading ? 'Uploading…' : 'Upload hero image'}</span>
                    <input
                      ref={heroInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      disabled={heroUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setHeroError(null);
                        setHeroUploading(true);
                        const fd = new FormData();
                        fd.append('heroImage', file);
                        const res = await fetch('/dashboard/branding/upload-hero', { method: 'POST', body: fd });
                        setHeroUploading(false);
                        e.target.value = '';
                        const r = await res.json();
                        if (!res.ok) setHeroError(r?.error || 'Upload failed');
                        else if (r?.coverImage) setCover(r.coverImage);
                      }}
                    />
                  </div>
                )}
                {heroError && <p className="rounded-lg bg-red-50 px-3 py-2 text-[0.75rem] text-red-700">{heroError}</p>}
                <p className="text-[0.68rem] text-black/35">
                  PNG, JPEG, or WebP — max 2 MB. Recommended: 1920×1080 (16:9) for full-width banner.
                  Used as the hero image on your guest menu's About or landing page.
                </p>
              </div>
              </div>
          </div>

          {/* contact */}
          <div className="dash-card p-5">
            <SectionHeading title="Contact & services" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Address" full><input name="address" defaultValue={data.address ?? ''} className={inputCls} /></Field>
              <Field label="Phone"><input name="phone" defaultValue={data.phone ?? ''} className={inputCls} /></Field>
              <Field label="Email"><input name="email" defaultValue={data.email ?? ''} className={inputCls} /></Field>
              <Field label="Wi-Fi name"><input name="wifiName" defaultValue={data.wifiName ?? ''} className={inputCls} /></Field>
              <Field label="Wi-Fi password"><input name="wifiPassword" defaultValue={data.wifiPassword ?? ''} className={inputCls} /></Field>
              <Field label="Instagram"><input name="instagram" defaultValue={data.instagram ?? ''} className={inputCls} /></Field>
              <Field label="Website"><input name="website" defaultValue={data.website ?? ''} className={inputCls} /></Field>
            </div>
          </div>

          {/* features */}
          <div className="dash-card p-5">
            <SectionHeading title="Guest features" />
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Feat name="featAi" label="AI assistant" checked={data.featAi} />
              <Feat name="featSpecials" label="Today's specials" checked={data.featSpecials} />
              <Feat name="featCallStaff" label="Call staff" checked={data.featCallStaff} />
              <Feat name="featBill" label="Request bill" checked={data.featBill} />
              <Feat name="featOrder" label="Ordering" checked={data.featOrder} />
              <Feat name="featFeedback" label="Feedback" checked={data.featFeedback} />
              <Feat name="featAbout" label="About us" checked={data.featAbout} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Currency">
                <select name="currency" defaultValue={data.currency} className={inputCls}>
                  <option value="MUR">MUR — Mauritian Rupee</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="USD">USD — US Dollar</option>
                </select>
              </Field>
              <Field label="Default language">
                <select name="defaultLang" defaultValue={data.defaultLang} className={inputCls}>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </Field>
            </div>
          </div>

          {/* colours */}
          <div className="dash-card p-5">
            <SectionHeading title="Colours & theme" />
            <div className="flex flex-wrap gap-2.5">
              {THEMES.map((t) => {
                const isCurrent = !customizing &&
                  primary === t.primary && accent === t.accent &&
                  surface === t.surface && text === t.text && mode === t.mode;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => applyTheme(t)}
                    className={`flex items-center gap-2.5 rounded-xl border ${isCurrent ? 'border-black/60 bg-black/[0.08]' : 'border-black/[0.08] bg-white'} px-3 py-2 transition hover:border-black/20`}
                  >
                    <span className="flex gap-1">
                      <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: t.surface }} />
                      <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: t.accent }} />
                    </span>
                    <span className="text-[0.78rem] font-medium">{t.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ColorField label="Primary" name="primaryColor" value={primary} onChange={updateColor(setPrimary)} />
              <ColorField label="Accent" name="accentColor" value={accent} onChange={updateColor(setAccent)} />
              <ColorField label="Surface" name="surfaceColor" value={surface} onChange={updateColor(setSurface)} />
              <ColorField label="Text" name="textColor" value={text} onChange={updateColor(setText)} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Theme mode">
                <select name="themeMode" value={mode} onChange={(e) => setMode(e.target.value)} className={inputCls}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </Field>
              <Field label="Button style">
                <select name="buttonStyle" value={buttonStyle} onChange={(e) => setButtonStyle(e.target.value)} className={inputCls}>
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                  <option value="square">Square</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-6 py-3 text-[0.88rem] font-semibold text-white disabled:opacity-60">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
            </button>
            {saved && <span className="flex items-center gap-1.5 text-[0.82rem] font-semibold text-[#4F5C46]"><Check className="h-4 w-4" /> Saved — changes are live</span>}
          </div>
        </div>

        {/* live preview */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">Live preview</p>
          <div className="overflow-hidden rounded-2xl border border-black/10 shadow-sm" style={{ background: surface, color: text }}>
            <div className="relative h-28 w-full overflow-hidden">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full" style={{ background: `linear-gradient(140deg, ${primary}, ${surface})` }} />
              )}
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${surface} 6%, transparent 60%)` }} />
            </div>
            <div className="px-4 pb-5">
              <div className="flex items-center gap-2.5">
                {logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="Logo" className="h-8 w-8 rounded-full object-contain" />
                )}
                <span className="inline-block rounded-full border px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider" style={{ borderColor: `${accent}66`, color: accent }}>
                  Table 8
                </span>
              </div>
              <h3 className="mt-2.5 font-display text-xl">{name}</h3>
              <p className="mt-1 text-[0.78rem]" style={{ opacity: 0.6 }}>{data.tagline || 'Your tagline'}</p>
              <button className="mt-4 w-full rounded-full py-2.5 text-[0.8rem] font-bold" style={{ background: accent, color: '#0a0f16' }}>
                View menu
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-xl border py-2.5 text-center text-[0.72rem] font-semibold" style={{ borderColor: `${text}22` }}>Ask AI</div>
                <div className="rounded-xl border py-2.5 text-center text-[0.72rem] font-semibold" style={{ borderColor: `${text}22` }}>Call staff</div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[0.72rem] leading-relaxed text-black/45">
            Colours apply instantly across the guest experience — one codebase, every restaurant branded.
          </p>
        </div>
      </form>
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[0.85rem] outline-none transition focus:border-black/30';
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wide text-black/45">{label}</span>
      {children}
    </label>
  );
}
function ColorField({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-wide text-black/45">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white p-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent" />
        <input name={name} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent font-mono text-[0.78rem] uppercase outline-none" />
      </div>
    </label>
  );
}
function Feat({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/[0.06] px-3.5 py-2.5 transition hover:border-black/15">
      <input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 accent-[#0c0c0c]" />
      <span className="text-[0.84rem]">{label}</span>
    </label>
  );
}
