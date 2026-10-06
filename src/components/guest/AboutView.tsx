'use client';

import { useGuest } from './GuestProvider';
import { MapPin, Phone, Wifi, Clock, Instagram, Globe, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const DAYS: Record<'en' | 'fr', string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
};

export function AboutView({ go }: { go: (v: any) => void }) {
  const { data, t, lang } = useGuest();
  const r = data.restaurant;
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const today = new Date().getDay();

  const hours = r.openingHours;

  return (
    <div className="anim-in px-5 pt-4">
      <h1 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>
        {t('about.title')}
      </h1>
      {r.description && (
        <p className="mt-3 text-[0.92rem] leading-relaxed" style={{ color: 'var(--ink)', opacity: 0.8 }}>
          {r.description}
        </p>
      )}

      {/* hours */}
      {hours.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: 'var(--brand-2)' }} />
            <h2 className="font-display text-lg" style={{ color: 'var(--ink)' }}>
              {t('about.hours')}
            </h2>
          </div>
          <div className="mt-3 space-y-1.5">
            {hours.map((h) => (
              <div
                key={h.dayOfWeek}
                className="flex items-center justify-between rounded-xl px-3.5 py-2 text-[0.85rem]"
                style={{
                  background: h.dayOfWeek === today ? 'color-mix(in srgb, var(--brand-2) 12%, transparent)' : 'transparent',
                  color: 'var(--ink)',
                  fontWeight: h.dayOfWeek === today ? 600 : 400,
                  border: h.dayOfWeek === today ? '1px solid color-mix(in srgb, var(--brand-2) 35%, transparent)' : '1px solid transparent',
                }}
              >
                <span>{DAYS[lang][h.dayOfWeek]}</span>
                <span style={{ color: h.closed ? 'var(--muted)' : 'var(--brand-2)' }}>
                  {h.closed || !h.open ? (lang === 'fr' ? 'Fermé' : 'Closed') : `${h.open} – ${h.close}`}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* contact */}
      <section className="mt-6 space-y-2">
        {r.address && (
          <Row icon={MapPin} label={t('about.findUs')} value={r.address} href={`https://maps.google.com/?q=${encodeURIComponent(r.address)}`} />
        )}
        {r.phone && <Row icon={Phone} label={lang === 'fr' ? 'Téléphone' : 'Phone'} value={r.phone} href={`tel:${r.phone.replace(/\s/g, '')}`} />}
        {r.wifiName && (
          <Row icon={Wifi} label={t('about.wifi')} value={`${r.wifiName}${r.wifiPassword ? ` · ${r.wifiPassword}` : ''}`} />
        )}
        {r.instagram && <Row icon={Instagram} label="Instagram" value={`@${r.instagram}`} href={`https://instagram.com/${r.instagram}`} />}
        {r.website && <Row icon={Globe} label={lang === 'fr' ? 'Site web' : 'Website'} value={r.website.replace(/^https?:\/\//, '')} href={r.website} />}
      </section>

      {/* FAQs */}
      {r.faqs.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-lg" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Questions fréquentes' : 'Frequently asked'}
          </h2>
          <div className="mt-3 space-y-2">
            {r.faqs.map((f, i) => {
              const q = lang === 'fr' && f.questionFr ? f.questionFr : f.question;
              const a = lang === 'fr' && f.answerFr ? f.answerFr : f.answer;
              const open = openFaq === i;
              return (
                <div key={i} className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
                  <button onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                    <span className="text-[0.88rem] font-semibold" style={{ color: 'var(--ink)' }}>
                      {q}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition" style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : undefined }} />
                  </button>
                  {open && (
                    <p className="px-4 pb-3.5 text-[0.85rem] leading-relaxed anim-in" style={{ color: 'var(--muted)' }}>
                      {a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <p className="mt-8 text-center text-[0.68rem]" style={{ color: 'var(--muted)' }}>
        {lang === 'fr' ? 'Propulsé par' : 'Powered by'} SmartMenus
      </p>
    </div>
  );
}

function Row({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-3.5 rounded-xl border px-4 py-3 transition" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--brand-2)' }} />
      <div className="min-w-0">
        <p className="eyebrow" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="mt-0.5 text-[0.88rem] break-words" style={{ color: 'var(--ink)' }}>{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block active:scale-[0.99]">
      {inner}
    </a>
  ) : (
    inner
  );
}
