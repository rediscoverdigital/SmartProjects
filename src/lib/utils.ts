import clsx, { type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(n: number, currency = 'MUR') {
  const cur = currency === 'MUR' ? 'Rs' : currency;
  const rounded = Number.isInteger(n) ? n : Math.round(n * 100) / 100;
  return `${cur} ${rounded.toLocaleString('en-US')}`;
}

/** Opaque, human-readable public code (never a raw DB id). */
export function generatePublicCode(len = 5) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function timeAgo(date: Date | string, lang: 'en' | 'fr' = 'en') {
  const d = typeof date === 'string' ? new Date(date) : date;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  const fr = lang === 'fr';
  if (sec < 45) return fr ? "à l'instant" : 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return fr ? `il y a ${min} min` : `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return fr ? `il y a ${h} h` : `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return fr ? 'hier' : 'yesterday';
  if (days < 7) return fr ? `il y a ${days} j` : `${days}d ago`;
  return d.toLocaleDateString(fr ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' });
}

export function todayLabel(lang: 'en' | 'fr' = 'en') {
  return new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

/** Parse comma-separated tag strings safely. */
export function tags(s?: string | null): string[] {
  if (!s) return [];
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** WCAG-ish contrast helper: pick readable text colour for a background. */
export function readableOn(hex: string) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0A0F16' : '#FFFFFF';
}
