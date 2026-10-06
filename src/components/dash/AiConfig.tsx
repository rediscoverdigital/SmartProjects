'use client';

import { useState, useTransition } from 'react';
import { saveAiConfig, saveFaq, deleteFaq } from '@/app/actions/dashboard';
import { SectionHeading, Empty } from './ui';
import { Sparkles, Plus, Pencil, Trash2, X, Loader2, Check, ShieldCheck, MessageSquareText, HelpCircle, UtensilsCrossed, Clock, Info } from 'lucide-react';

type Faq = { id: string; question: string; questionFr: string | null; answer: string; answerFr: string | null };

export function AiConfig({
  featAi, welcomeMsg, quota, faqs, usage, questions, knowledge,
}: {
  featAi: boolean;
  welcomeMsg: string;
  quota: number;
  faqs: Faq[];
  usage: { convos: number; msgs: number; unanswered: number; groundingRate: number };
  questions: { q: string; n: number }[];
  knowledge: { items: number; categories: number; faqs: number; hours: number; hasProfile: boolean };
}) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [creatingFaq, setCreatingFaq] = useState(false);
  const [enabled, setEnabled] = useState(featAi);

  const usagePct = Math.min(Math.round((usage.convos / quota) * 100), 100);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[1.5rem]">AI assistant</h1>
        <p className="text-[0.82rem] text-black/45">A restaurant-specific assistant. It answers only from your data — it does not invent.</p>
      </div>

      {/* usage */}
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="dash-card p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">Conversations this month</p>
          <p className="mt-2 font-display text-[1.8rem] leading-none">{usage.convos}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full bg-[#8E7642]" style={{ width: `${usagePct}%` }} />
          </div>
          <p className="mt-1.5 text-[0.72rem] text-black/45">{usagePct}% of {quota.toLocaleString('en-US')} plan allowance</p>
        </div>
        <div className="dash-card p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">Messages</p>
          <p className="mt-2 font-display text-[1.8rem] leading-none">{usage.msgs}</p>
        </div>
        <div className="dash-card p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">Unanswered</p>
          <p className="mt-2 font-display text-[1.8rem] leading-none text-[#C25E1E]">{usage.unanswered}</p>
          <p className="mt-1.5 text-[0.72rem] text-black/45">escalated to staff</p>
        </div>
        <div className="dash-card p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">Grounding rate</p>
          <p className="mt-2 font-display text-[1.8rem] leading-none text-[#4F5C46]">{usage.groundingRate}%</p>
          <p className="mt-1.5 text-[0.72rem] text-black/45">answers from your data</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* config */}
        <div className="dash-card p-5 lg:col-span-2">
          <SectionHeading title="Configuration" />
          <form
            action={(fd) => start(async () => { await saveAiConfig(fd); setSaved(true); setTimeout(() => setSaved(false), 2000); })}
            className="space-y-4"
          >
            <label className="flex items-center justify-between rounded-xl border border-black/[0.06] px-4 py-3.5">
              <div>
                <p className="text-[0.88rem] font-semibold">Assistant enabled</p>
                <p className="text-[0.75rem] text-black/45">Guests can ask questions from the menu and item pages</p>
              </div>
              <input type="checkbox" name="featAi" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-[#0c0c0c]" />
            </label>

            <Field label="Welcome message">
              <textarea name="welcomeMsg" defaultValue={welcomeMsg} rows={2} className={inputCls} placeholder="Hi! How can I help you choose?" />
            </Field>

            <Field label="Monthly conversation allowance">
              <input name="aiMonthlyQuota" type="number" defaultValue={quota} className={inputCls} />
            </Field>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-full bg-[#0c0c0c] px-6 py-2.5 text-[0.85rem] font-semibold text-white disabled:opacity-60">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
              </button>
              {saved && <span className="flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#4F5C46]"><Check className="h-4 w-4" /> Saved</span>}
            </div>
          </form>
        </div>

        {/* knowledge */}
        <div className="dash-card p-5">
          <SectionHeading title="Knowledge base" />
          <p className="text-[0.75rem] leading-relaxed text-black/45">
            The assistant is grounded in your structured data — not a free-text prompt.
          </p>
          <div className="mt-4 space-y-2.5">
            <KRow icon={UtensilsCrossed} label="Menu items" value={knowledge.items} ok={knowledge.items > 0} />
            <KRow icon={Info} label="Categories" value={knowledge.categories} ok={knowledge.categories > 0} />
            <KRow icon={HelpCircle} label="FAQs" value={knowledge.faqs} ok={knowledge.faqs > 0} />
            <KRow icon={Clock} label="Opening hours" value={knowledge.hours} ok={knowledge.hours > 0} />
            <KRow icon={MessageSquareText} label="Restaurant profile" value={knowledge.hasProfile ? 'Set' : 'Missing'} ok={knowledge.hasProfile} />
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#0c0c0c]/[0.03] px-3.5 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#4F5C46]" />
            <p className="text-[0.72rem] leading-relaxed text-black/55">
              Guardrails on: no medical claims, no invented prices or promotions, no allergen-safety guarantees, and sold-out items are never recommended.
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="dash-card p-5">
        <SectionHeading
          title="FAQs"
          action={
            <button onClick={() => { setCreatingFaq(true); setEditingFaq(null); }} className="flex items-center gap-1.5 rounded-full bg-[#0c0c0c] px-3.5 py-2 text-[0.78rem] font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> Add FAQ
            </button>
          }
        />
        {faqs.length === 0 && !creatingFaq ? (
          <Empty icon={HelpCircle} title="No FAQs yet" body="Add the questions guests ask most — the assistant will answer them verbatim." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              {faqs.map((f) => (
                <div key={f.id} className="flex items-start gap-3 rounded-xl border border-black/[0.06] px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.85rem] font-semibold">{f.question}</p>
                    <p className="mt-0.5 text-[0.78rem] text-black/50">{f.answer}</p>
                  </div>
                  <button onClick={() => { setEditingFaq(f); setCreatingFaq(false); }} className="rounded-lg p-1.5 text-black/40 hover:bg-black/[0.05] hover:text-black">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => start(async () => { await deleteFaq(f.id); })} className="rounded-lg p-1.5 text-black/40 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {(creatingFaq || editingFaq) && (
              <form
                action={(fd) => start(async () => { await saveFaq(fd); setCreatingFaq(false); setEditingFaq(null); })}
                className="h-fit rounded-xl border border-black/[0.06] p-4"
              >
                <h3 className="text-[0.9rem] font-semibold">{editingFaq ? 'Edit FAQ' : 'New FAQ'}</h3>
                {editingFaq && <input type="hidden" name="id" value={editingFaq.id} />}
                <div className="mt-3 space-y-3">
                  <Field label="Question (EN)"><input name="question" defaultValue={editingFaq?.question} required className={inputCls} /></Field>
                  <Field label="Question (FR)"><input name="questionFr" defaultValue={editingFaq?.questionFr ?? undefined} className={inputCls} /></Field>
                  <Field label="Answer (EN)"><textarea name="answer" defaultValue={editingFaq?.answer} required rows={2} className={inputCls} /></Field>
                  <Field label="Answer (FR)"><textarea name="answerFr" defaultValue={editingFaq?.answerFr ?? undefined} rows={2} className={inputCls} /></Field>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => { setCreatingFaq(false); setEditingFaq(null); }} className="rounded-full border border-black/10 px-4 py-2 text-[0.8rem] font-semibold">Cancel</button>
                  <button type="submit" disabled={pending} className="rounded-full bg-[#0c0c0c] px-5 py-2 text-[0.8rem] font-semibold text-white">Save</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* recent questions */}
      {questions.length > 0 && (
        <div className="dash-card p-5">
          <SectionHeading title="Recent guest questions" />
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-4 py-2.5">
                <span className="text-[0.85rem] text-black/75">“{q.q}”</span>
                {q.n > 1 && <span className="text-[0.72rem] text-black/40">{q.n}×</span>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.72rem] text-black/45">
            Unanswered questions are a signal: add an FAQ or a dish note to close the gap.
          </p>
        </div>
      )}
    </div>
  );
}

function KRow({ icon: Icon, label, value, ok }: { icon: any; label: string; value: string | number; ok: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-black/35" />
      <span className="flex-1 text-[0.82rem] text-black/65">{label}</span>
      <span className={`text-[0.82rem] font-semibold ${ok ? 'text-[#4F5C46]' : 'text-[#C25E1E]'}`}>{value}</span>
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
