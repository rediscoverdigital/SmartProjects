import { getCurrentUser } from '@/lib/auth';
import { getOverview, getTopViewed, getTopSearches, getTopAiQuestions, getTableActivity, getDailySeries, getFeedbackSummary } from '@/lib/analytics-queries';
import { StatCard, BarChart, BarList, Donut, SectionHeading, Empty } from '@/components/dash/ui';
import { fmtDuration } from '@/lib/utils';
import { Users, Eye, Sparkles, BellRing, Star, Repeat, Search } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
] as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: { range?: string } }) {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;
  const rid = user.restaurantId;
  const range = (['today', '7d', '30d', '90d'].includes(searchParams.range || '') ? searchParams.range : '30d') as any;

  const [ov, top, searches, aiQs, tables, series, fb] = await Promise.all([
    getOverview(rid, range),
    getTopViewed(rid, range, 8),
    getTopSearches(rid, range, 8),
    getTopAiQuestions(rid, range, 6),
    getTableActivity(rid, range),
    getDailySeries(rid, range),
    getFeedbackSummary(rid),
  ]);

  const topTables = [...tables].sort((a, b) => b.scans - a.scans).slice(0, 8);
  const hasData = ov.sessions > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.5rem]">Analytics</h1>
          <p className="text-[0.82rem] text-black/45">Interaction, engagement, AI and operational metrics</p>
        </div>
        <div className="flex rounded-full border border-black/10 bg-white p-0.5">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/dashboard/analytics?range=${r.key}`}
              className={`rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition ${range === r.key ? 'bg-[#0c0c0c] text-white' : 'text-black/55 hover:text-black'}`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="dash-card">
          <Empty icon={Eye} title="Not enough data yet" body="Once guests start using your SmartMenu, insights will appear here." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Sessions" value={ov.sessions} icon={Users} hint={`${ov.scans} scans`} />
            <StatCard label="Menu views" value={ov.menuViews} icon={Eye} />
            <StatCard label="AI conversations" value={ov.aiConvos} icon={Sparkles} tone="gold" hint={`${ov.aiUnanswered} unanswered`} />
            <StatCard label="Avg session" value={fmtDuration(ov.avgSession)} icon={Repeat} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="dash-card p-5 lg:col-span-2">
              <SectionHeading title="Sessions over time" />
              <BarChart data={series} height={150} />
            </div>
            <div className="dash-card p-5">
              <SectionHeading title="NFC vs QR" />
              <Donut segments={[{ label: 'NFC', value: ov.nfc, color: '#0c0c0c' }, { label: 'QR', value: ov.qr, color: '#8E7642' }]} />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="dash-card p-5">
              <SectionHeading title="Most-viewed dishes" />
              {top.length ? <BarList items={top.map((t) => ({ label: t.label, count: t.count }))} /> : <Empty title="No item views yet" />}
            </div>
            <div className="dash-card p-5">
              <SectionHeading title="Table activity" />
              {topTables.length ? (
                <BarList items={topTables.map((t) => ({ label: t.label, count: t.scans, sub: t.location }))} accent="#0c0c0c" />
              ) : <Empty title="No table activity yet" />}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="dash-card p-5">
              <SectionHeading title="Most-searched" />
              {searches.length ? (
                <div className="space-y-2">
                  {searches.map((s) => (
                    <div key={s.label} className="flex items-center justify-between rounded-xl bg-black/[0.03] px-3.5 py-2.5">
                      <span className="flex items-center gap-2 text-[0.85rem]"><Search className="h-3.5 w-3.5 text-black/35" /> “{s.label}”</span>
                      <span className="text-[0.78rem] tabular-nums text-black/45">{s.count}</span>
                    </div>
                  ))}
                </div>
              ) : <Empty title="No searches yet" />}
            </div>

            <div className="dash-card p-5">
              <SectionHeading title="AI questions" />
              {aiQs.length ? (
                <div className="space-y-2">
                  {aiQs.map((q, i) => (
                    <div key={i} className="rounded-xl bg-black/[0.03] px-3.5 py-2.5">
                      <p className="text-[0.82rem] text-black/75">“{q.q}”</p>
                      {q.n > 1 && <p className="mt-0.5 text-[0.68rem] text-black/40">asked {q.n}×</p>}
                    </div>
                  ))}
                </div>
              ) : <Empty title="No AI conversations yet" />}
            </div>

            <div className="dash-card p-5">
              <SectionHeading title="Feedback" />
              <div className="flex items-center gap-3">
                <span className="font-display text-[2.4rem] leading-none">{fb.average || '—'}</span>
                <div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5" fill={i < Math.round(fb.average) ? '#8E7642' : 'none'} stroke="#8E7642" />
                    ))}
                  </div>
                  <p className="mt-1 text-[0.75rem] text-black/45">{fb.count} responses</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((r) => {
                  const n = fb.list.filter((f) => f.rating === r).length;
                  const pct = fb.count ? (n / fb.count) * 100 : 0;
                  return (
                    <div key={r} className="flex items-center gap-2 text-[0.75rem]">
                      <span className="w-3 text-black/45">{r}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                        <div className="h-full rounded-full bg-[#8E7642]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right tabular-nums text-black/40">{n}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
