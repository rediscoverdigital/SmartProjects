'use client';

import { useEffect, useRef, useState } from 'react';
import { useGuest } from './GuestProvider';
import { Sparkles, Send, ArrowRight, PhoneCall } from 'lucide-react';

type Msg = {
  role: 'user' | 'assistant';
  content: string;
  suggestedItems?: { id: string; name: string }[];
  unanswered?: boolean;
};

export function AiView({ openItem, go }: { openItem: (id: string) => void; go: (v: any) => void }) {
  const { data, t, lang } = useGuest();
  const r = data.restaurant;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [convoId, setConvoId] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions =
    lang === 'fr'
      ? ['Que recommandez-vous ?', 'Qu’est-ce qui est végétarien ?', 'Je veux quelque chose de léger.', 'Quels plats contiennent des fruits de mer ?']
      : ["What do you recommend?", 'What is vegetarian?', 'I want something light.', 'Which dishes have seafood?'];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setBusy(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          restaurantId: r.id,
          sessionId: data.sessionId,
          conversationId: convoId,
          question,
          language: lang,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'error');
      setConvoId(json.conversationId);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: json.answer, suggestedItems: json.suggestedItems, unanswered: json.unanswered },
      ]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: t('err.networkBody'), unanswered: true }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="anim-in flex min-h-[calc(100vh-9rem)] flex-col">
      {/* header */}
      <div className="px-5 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'var(--brand-2)' }}>
            <Sparkles className="h-5 w-5" style={{ color: 'var(--on-accent, #0a0f16)' }} />
          </span>
          <div>
            <h1 className="font-display text-xl" style={{ color: 'var(--ink)' }}>
              {t('ai.title')}
            </h1>
            <p className="text-[0.72rem]" style={{ color: 'var(--brand-2)' }}>
              {r.name} · {lang === 'fr' ? 'en ligne' : 'online'}
            </p>
          </div>
        </div>
      </div>

      {/* conversation */}
      <div ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
        {messages.length === 0 && (
          <div className="anim-up">
            <div className="rounded-2xl rounded-tl-md border p-4" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
              <p className="text-[0.95rem] leading-relaxed" style={{ color: 'var(--ink)' }}>
                {t('ai.greeting')} {t('ai.subtitle')}
              </p>
            </div>
            <p className="eyebrow mt-6" style={{ color: 'var(--muted)' }}>
              {t('ai.tryAsking')}
            </p>
            <div className="mt-3 space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-[0.88rem] transition active:scale-[0.99]"
                  style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
                >
                  <span style={{ color: 'var(--brand-2)' }}>“</span>
                  <span className="flex-1">{s}</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <Bubble key={i} msg={m} openItem={openItem} go={go} />
        ))}

        {busy && (
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--card-strong)' }}>
              <Sparkles className="h-4 w-4" style={{ color: 'var(--brand-2)' }} />
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border px-4 py-3" style={{ borderColor: 'var(--line)', background: 'var(--card)' }}>
              {[0, 1, 2].map((d) => (
                <span key={d} className="typing-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--muted)', animationDelay: `${d * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* composer */}
      <div className="sticky bottom-[68px] z-10 px-5 pb-3 pt-2" style={{ background: 'color-mix(in srgb, var(--surface) 92%, transparent)' }}>
        <p className="mb-2 text-center text-[0.66rem] leading-relaxed" style={{ color: 'var(--muted)' }}>
          {t('ai.disclaimer')}
        </p>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            rows={1}
            placeholder={t('ai.placeholder')}
            className="max-h-28 flex-1 resize-none rounded-2xl border px-4 py-3 text-[0.9rem] outline-none transition focus:border-[var(--brand-2)]"
            style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
            aria-label={t('ai.placeholder')}
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim() || busy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-40"
            style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}
            aria-label={t('common.send')}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg, openItem, go }: { msg: Msg; openItem: (id: string) => void; go: (v: any) => void }) {
  const { t } = useGuest();
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end anim-up">
        <div className="max-w-[82%] rounded-2xl rounded-tr-md px-4 py-3 text-[0.9rem] leading-relaxed" style={{ background: 'var(--brand-2)', color: 'var(--on-accent, #0a0f16)' }}>
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 anim-up">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--card-strong)' }}>
        <Sparkles className="h-4 w-4" style={{ color: 'var(--brand-2)' }} />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="whitespace-pre-line rounded-2xl rounded-tl-md border px-4 py-3 text-[0.9rem] leading-relaxed"
          style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
        >
          {msg.content}
        </div>

        {msg.suggestedItems && msg.suggestedItems.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {msg.suggestedItems.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => openItem(s.id)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] font-semibold transition active:scale-95"
                style={{ borderColor: 'color-mix(in srgb, var(--brand-2) 45%, transparent)', color: 'var(--brand-2)' }}
              >
                {s.name} <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {msg.unanswered && (
          <button
            onClick={() => go('actions')}
            className="mt-2.5 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[0.8rem] font-semibold transition active:scale-95"
            style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--ink)' }}
          >
            <PhoneCall className="h-3.5 w-3.5" style={{ color: 'var(--brand-2)' }} />
            {t('ai.callStaff')}
          </button>
        )}
      </div>
    </div>
  );
}
