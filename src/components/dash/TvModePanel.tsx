'use client';

import { useState, useTransition } from 'react';
import { generateTvToken, revokeTvToken } from '@/app/actions/dashboard';
import { Tv, Copy, Check, RefreshCw, ExternalLink, Loader2, Power } from 'lucide-react';

export function TvModePanel({ initialToken }: { initialToken: string | null }) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const url = token && typeof window !== 'undefined' ? `${window.location.origin}/tv/${token}` : '';

  const generate = () =>
    start(async () => {
      const res = await generateTvToken();
      if (res?.token) setToken(res.token);
    });

  const revoke = () =>
    start(async () => {
      await revokeTvToken();
      setToken(null);
    });

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — user can select the text manually */
    }
  };

  return (
    <div className="dash-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-black/[0.05]">
          <Tv className="h-5 w-5 text-[#C25E1E]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[1.05rem]">TV display</h3>
          <p className="text-[0.8rem] text-black/50">
            A full-screen board for a kitchen or front-of-house screen. Requests flash orange after 2 minutes
            and red after 5 minutes so nothing is missed.
          </p>

          {token ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-black/[0.03] p-2.5">
                <code className="min-w-0 flex-1 truncate font-mono text-[0.78rem] text-black/70">{url}</code>
                <button
                  onClick={copy}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[0.75rem] font-semibold transition hover:border-black/25"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[0.75rem] font-semibold transition hover:border-black/25"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
              </div>
              <p className="text-[0.72rem] text-black/40">
                Open this on the TV&apos;s browser and press full-screen (F11). The link is read-only and only
                shows this restaurant&apos;s floor.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={generate}
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-2 text-[0.78rem] font-semibold transition hover:border-black/25 disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Regenerate link
                </button>
                <button
                  onClick={revoke}
                  disabled={pending}
                  className="flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-[0.78rem] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                >
                  <Power className="h-3.5 w-3.5" />
                  Revoke
                </button>
              </div>
              <p className="text-[0.7rem] text-black/35">
                Regenerating or revoking immediately disconnects any TV using the old link.
              </p>
            </div>
          ) : (
            <button
              onClick={generate}
              disabled={pending}
              className="mt-3 flex items-center gap-2 rounded-full bg-[#0c0c0c] px-5 py-2.5 text-[0.82rem] font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tv className="h-4 w-4" />}
              Create TV link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
