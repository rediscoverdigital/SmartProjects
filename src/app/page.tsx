import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Nfc, QrCode, Sparkles, ArrowRight, UtensilsCrossed, BellRing, LineChart, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getTenants() {
  const restaurants = await prisma.restaurant.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'asc' },
    include: {
      tables: { include: { objects: true }, take: 1 },
      _count: { select: { items: true, tables: true } },
    },
  });
  return restaurants;
}

export default async function Home() {
  const tenants = await getTenants();
  const hero = tenants[0];
  const heroCode = hero?.tables[0]?.objects[0]?.publicCode ?? 'T8SAUV';

  return (
    <main className="min-h-screen bg-[#0A0F16] text-[#F4F1E8] selection:bg-brass-400 selection:text-ink-950">
      {/* ── Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0F16]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-lg tracking-tight">SmartMenus</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a href="#how" className="transition hover:text-white">How it works</a>
            <a href="#pilot" className="transition hover:text-white">Pilot</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
          </nav>
          <Link
            href="/login"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-[0.22] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #C0A86C 0%, transparent 68%)' }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-20 sm:px-8 sm:pt-28">
          <p className="eyebrow anim-up text-brass-400">Mauritius · Commercial Pilot</p>
          <h1 className="anim-up mt-5 max-w-4xl font-display text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-7xl" style={{ animationDelay: '0.06s' }}>
            Turn every table into a<br className="hidden sm:block" /> digital assistant.
          </h1>
          <p className="anim-up mt-7 max-w-xl text-lg leading-relaxed text-white/62" style={{ animationDelay: '0.12s' }}>
            Not a QR PDF. A mobile guest experience — menu, allergens, AI concierge,
            service calls — starting with a tap.
          </p>
          <div className="anim-up mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: '0.18s' }}>
            <Link
              href={`/t/${heroCode}`}
              className="btn btn-primary shape-pill px-6 py-3.5 text-[0.95rem]"
            >
              Try the guest experience <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="btn shape-pill border border-white/20 bg-white/5 px-6 py-3.5 text-[0.95rem] text-white hover:bg-white/10"
            >
              Open the dashboard
            </Link>
          </div>
          <div className="anim-up mt-10 flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/38" style={{ animationDelay: '0.24s' }}>
            <span>Tap</span><span className="text-brass-400">→</span>
            <span>See</span><span className="text-brass-400">→</span>
            <span>Ask</span><span className="text-brass-400">→</span>
            <span>Act</span>
          </div>
        </div>

        {/* hero image card */}
        <div className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-8">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 anim-up" style={{ animationDelay: '0.3s' }}>
            {hero?.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.coverImage} alt="" className="h-[320px] w-full object-cover sm:h-[440px]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-6 sm:p-9">
              <div>
                <p className="eyebrow text-brass-400">{hero?.name ?? 'Côte Sauvage'} · Table 8</p>
                <p className="mt-2 max-w-md font-display text-2xl sm:text-3xl">Your digital front-of-house.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white/75 backdrop-blur">
                  <Nfc className="h-3.5 w-3.5 text-brass-400" /> NFC
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white/75 backdrop-blur">
                  <QrCode className="h-3.5 w-3.5 text-brass-400" /> QR fallback
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────── */}
      <section id="how" className="border-t border-white/10 bg-[#0C0C0C] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="eyebrow text-brass-400">The flow</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl sm:text-4xl">
            Four steps, no app, no account.
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '01', t: 'Tap', d: 'NFC on a table object, QR as fallback. Opaque public codes — never raw IDs.', icon: Nfc },
              { n: '02', t: 'See', d: 'A branded, mobile-first menu. Categories, allergens, dietary filters, specials.', icon: UtensilsCrossed },
              { n: '03', t: 'Ask', d: "A restaurant-specific AI. It knows tonight's menu. It does not invent.", icon: Sparkles },
              { n: '04', t: 'Act', d: 'Call staff, request the bill, send an order, leave feedback — the floor is notified.', icon: BellRing },
            ].map((s) => (
              <div key={s.n} className="group">
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm text-brass-400">{s.n}</span>
                  <s.icon className="h-4 w-4 text-white/40 transition group-hover:text-brass-400" />
                </div>
                <h3 className="mt-4 font-display text-xl">{s.t}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-white/55">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pilot tenants ───────────────────────────── */}
      <section id="pilot" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="eyebrow text-brass-400">Live pilot</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl sm:text-4xl">
            Three tables, three rooms.
          </h2>
          <p className="mt-4 max-w-xl text-white/55">
            The pilot is seeded with a fine-dining room, a harbour grill, and a
            Cascavelle café — the same platform, isolated tenants.
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {tenants.map((r) => {
              const code = r.tables[0]?.objects[0]?.publicCode;
              return (
                <Link
                  key={r.id}
                  href={code ? `/t/${code}` : '/'}
                  className="group relative overflow-hidden rounded-3xl border border-white/10"
                >
                  <div className="relative h-72 w-full overflow-hidden">
                    {r.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.coverImage} alt="" className="img-zoom h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span
                      className="inline-block h-1.5 w-8 rounded-full"
                      style={{ background: r.accentColor }}
                    />
                    <h3 className="mt-3 font-display text-2xl">{r.name}</h3>
                    <p className="mt-1 text-sm text-white/65">{r.tagline}</p>
                    <div className="mt-4 flex items-center gap-4 text-[0.7rem] text-white/45">
                      <span>{r._count.items} items</span>
                      <span>·</span>
                      <span>{r._count.tables} tables</span>
                      <span>·</span>
                      <span className="uppercase tracking-wider">{r.plan}</span>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-white/85 transition group-hover:gap-3">
                      Open menu <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Platform ────────────────────────────────── */}
      <section className="border-t border-white/10 bg-[#0C0C0C] py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow text-brass-400">For the restaurant</p>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl">
              Edit. Publish. Understand. Improve.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-white/55">
              A CMS that needs no technical assistance, table-level analytics,
              and an AI you can configure from structured data — never a black box.
            </p>
            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              {[
                { icon: UtensilsCrossed, t: 'Menu CMS', d: 'Categories, items, pricing, availability, allergens.' },
                { icon: LineChart, t: 'Analytics', d: 'Scans, views, searches, AI questions, table activity.' },
                { icon: Sparkles, t: 'AI config', d: 'Structured knowledge, FAQs, tone, guardrails.' },
                { icon: ShieldCheck, t: 'Multi-tenant', d: 'Strict isolation, role-based access, audit logs.' },
              ].map((f) => (
                <div key={f.t} className="flex gap-3.5">
                  <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-brass-400" />
                  <div>
                    <p className="text-sm font-semibold">{f.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/50">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-2">
            <div className="rounded-2xl bg-[#F6F5F1] p-5 text-ink-950">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-950/45">Live floor · Côte Sauvage</p>
              <div className="mt-4 space-y-2.5">
                {[
                  { t: 'Table 12', k: 'Call staff', c: '#C25E1E' },
                  { t: 'Table 8', k: 'Request bill', c: '#7E8F72' },
                  { t: 'Table 4', k: 'Water', c: '#AE9455' },
                ].map((r) => (
                  <div key={r.t} className="flex items-center justify-between rounded-xl border border-black/5 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.c }} />
                      <span className="text-sm font-semibold">{r.t}</span>
                    </div>
                    <span className="text-xs text-ink-950/50">{r.k}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {[['Sessions', '1,284'], ['Views', '1,102'], ['AI chats', '86']].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-white p-3">
                    <p className="text-[0.65rem] uppercase tracking-wide text-ink-950/40">{l}</p>
                    <p className="mt-1 font-display text-xl">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <p className="eyebrow text-brass-400">Subscription architecture</p>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl">Simple monthly plans.</h2>
          <p className="mt-4 text-white/50">Initial commercial hypotheses, in Mauritian rupees. Validated in pilot.</p>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { n: 'Starter', p: 'Rs 1,500', f: ['Digital menu', 'NFC / QR objects', 'Basic analytics', '1 location', 'Basic branding'], hi: false },
              { n: 'Growth', p: 'Rs 3,000', f: ['Everything in Starter', 'AI assistant', 'Advanced analytics', 'Table analytics', 'Feedback', 'Service requests'], hi: true },
              { n: 'Pro', p: 'Rs 5,000–7,500', f: ['Everything in Growth', 'Ordering', 'Advanced AI', 'Integrations-ready', 'Priority support'], hi: false },
            ].map((tier) => (
              <div
                key={tier.n}
                className={`relative rounded-3xl border p-7 ${tier.hi ? 'border-brass-400/60 bg-brass-400/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}
              >
                {tier.hi && (
                  <span className="absolute -top-3 left-7 rounded-full bg-brass-400 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-ink-950">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-xl">{tier.n}</h3>
                <p className="mt-3 font-display text-3xl">{tier.p}<span className="text-base text-white/40"> / mo</span></p>
                <ul className="mt-6 space-y-2.5">
                  {tier.f.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brass-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0C0C0C] py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display">SmartMenus</span>
          </div>
          <p className="text-xs text-white/35">
            Your restaurant’s digital guest experience, built into every table. · Rediscover Studios
          </p>
          <div className="flex items-center gap-4 text-xs text-white/45">
            <Link href="/login" className="transition hover:text-white">Dashboard</Link>
            <Link href={`/t/${heroCode}`} className="transition hover:text-white">Demo</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Logo() {
  return (
    <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-brass-400/50">
      <span className="h-2.5 w-2.5 rounded-full bg-brass-400" />
    </span>
  );
}
