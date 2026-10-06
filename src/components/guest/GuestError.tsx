'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useGuest } from './GuestProvider';
import { Nfc, QrCode, Wifi, RefreshCw, Home } from 'lucide-react';
import { makeT } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

type Kind = 'not_found' | 'unavailable' | 'suspended' | 'network';

export function GuestError({ kind }: { kind?: Kind }) {
  const k = kind ?? 'not_found';
  const t = makeT((k === 'not_found' || k === 'unavailable') ? 'en' : 'en');

  const msgs: Record<Kind, { title: string; body: string; icon: any }> = {
    not_found: {
      title: 'We couldn’t find this menu.',
      body: 'Please scan the QR code again or ask staff for assistance.',
      icon: QrCode,
    },
    unavailable: {
      title: 'This menu is currently unavailable.',
      body: 'Please ask a member of staff for assistance.',
      icon: Wifi,
    },
    suspended: {
      title: 'This menu is temporarily unavailable.',
      body: 'Please ask a member of staff for assistance.',
      icon: QrCode,
    },
    network: {
      title: 'Connection issue',
      body: 'Please check your connection and try again.',
      icon: Wifi,
    },
  };
  const m = msgs[k];

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6 py-24 text-center" style={{ background: 'var(--surface)', color: 'var(--ink)' }}>
      <div className="max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto" style={{ background: 'color-mix(in srgb, var(--brand-2) 12%, transparent)' }}>
          <m.icon className="h-7 w-7" style={{ color: 'var(--brand-2)' }} />
        </div>
        <h1 className="mt-5 font-display text-2xl" style={{ color: 'var(--ink)' }}>{m.title}</h1>
        <p className="mt-2.5 text-[0.9rem] leading-relaxed" style={{ color: 'var(--muted)' }}>{m.body}</p>

        {k === 'network' && (
          <button
            onClick={() => typeof window !== 'undefined' && window.location.reload()}
            className="mt-6 rounded-full border px-6 py-3 text-[0.88rem] font-semibold transition active:scale-95"
            style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </button>
        )}
        {k === 'not_found' && (
          <button
            onClick={() => { window.location.href = '/'; }}
            className="mt-6 rounded-full border px-6 py-3 text-[0.88rem] font-semibold transition active:scale-95"
            style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
          >
            <Home className="mr-2 h-4 w-4" /> Back to SmartMenus
          </button>
        )}
      </div>
    </div>
  );
}
