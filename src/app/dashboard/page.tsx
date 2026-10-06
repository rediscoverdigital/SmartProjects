import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getOverview, getTopViewed, getDailySeries, getTableActivity } from '@/lib/analytics-queries';
import { StatCard, BarChart, BarList, Donut, SectionHeading, Empty } from '@/components/dash/ui';
import { Users, ScanLine, Eye, Sparkles, BellRing, Star, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { fmtDuration } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;
  const rid = user.restaurantId;

  const [ov, top, series, tables, restaurant, recentReqs] = await Promise.all([
    getOverview(rid, 'today'),
    getTopViewed(rid, '30d', 6),
    getDailySeries(rid, '30d'),
    getTableActivity(rid, '30d'),
    prisma.restaurant.findUnique({ where: { id: rid } }),
    prisma.serviceRequest.findMany({
      where: { restaurantId: rid, status: { in: ['new', 'acknowledged'] } },
      include: { table: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  const topTables = [...tables].sort((a, b) => b.scans - a.scans).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* stat grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sessions today" value={ov.sessions} icon={Users} hint={`${ov.scans} scans`} />
        <StatCard label="Menu views" value={ov.menuViews} icon={Eye} />
        <StatCard label="AI conversations" value={ov.aiConvos} icon={Sparkles} tone="gold" hint={`${ov.aiUnanswered} unanswered`} />
        <StatCard label="Service requests" value={ov.serviceReqs} icon={BellRing} tone={ov.serviceReqs > 0 ? 'warn' : 'default'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* traffic chart */}
        <div className="dash-card p-5 lg:col-span-2">
          <SectionHeading title="Sessions · last 30 days" action={<span className="text-[0.72rem] text-black/40">avg {fmtDuration(ov.avgSession)}</span>} />
          <BarChart data={series} height={140} />
          <div className="mt-2 flex justify-between text-[0.66rem] text-black/35">
            <span>{series[0]?.label}</span>
            <span>{series[Math.floor(series.length / 2)]?.label}</span>
            <span>{series[series.length - 1]?.label}</span>
          </div>
        </div>

        {/* acquisition */}
        <div className="dash-card p-5">
          <SectionHeading title="Acquisition" />
          <Donut
            segments={[
              { label: 'NFC', value: ov.nfc, color: '#0c0c0c' },
              { label: 'QR', value: ov.qr, color: '#8E7642' },
            ]}
          />
          <p className="mt-5 text-[0.75rem] leading-relaxed text-black/45">
            NFC is the primary entry point; QR is the universal fallback. Both resolve to the same opaque table code.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* top items */}
        <div className="dash-card p-5">
          <SectionHeading title="Most-viewed dishes" />
          {top.length ? (
            <BarList items={top.map((t) => ({ label: t.label, count: t.count }))} />
          ) : (
            <Empty title="Not enough data yet" body="Once guests start browsing, insights appear here." />
          )}
        </div>

        {/* table activity */}
        <div className="dash-card p-5">
          <SectionHeading
            title="Table activity"
            action={<Link href="/dashboard/tables" className="text-[0.72rem] font-semibold text-[#8E7642]">View all</Link>}
          />
          {topTables.length ? (
            <BarList items={topTables.map((t) => ({ label: t.label, count: t.scans, sub: t.location }))} accent="#0c0c0c" />
          ) : (
            <Empty title="No tables yet" />
          )}
        </div>

        {/* live floor */}
        <div className="dash-card p-5">
          <SectionHeading
            title="Open requests"
            action={<Link href="/dashboard/floor" className="text-[0.72rem] font-semibold text-[#8E7642]">Live floor</Link>}
          />
          {recentReqs.length ? (
            <div className="space-y-2.5">
              {recentReqs.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-black/[0.06] px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-[#C25E1E]" />
                    <div>
                      <p className="text-[0.82rem] font-semibold">{r.table?.label ?? 'Table'}</p>
                      <p className="text-[0.7rem] capitalize text-black/45">{r.label}</p>
                    </div>
                  </div>
                  <span className="text-[0.68rem] text-black/40">{minsAgo(r.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={BellRing} title="All clear" body="No open service requests right now." />
          )}
        </div>
      </div>

      {/* AI usage */}
      <div className="dash-card p-5">
        <SectionHeading title="AI usage this month" action={<Link href="/dashboard/ai" className="text-[0.72rem] font-semibold text-[#8E7642]">Configure</Link>} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-black/[0.03] p-3.5">
            <p className="text-[0.66rem] uppercase tracking-wide text-black/40">Conversations</p>
            <p className="mt-1 font-display text-xl">{ov.aiConvos}</p>
          </div>
          <div className="rounded-xl bg-black/[0.03] p-3.5">
            <p className="text-[0.66rem] uppercase tracking-wide text-black/40">Plan allowance</p>
            <p className="mt-1 font-display text-xl">{(restaurant?.aiMonthlyQuota ?? 2000).toLocaleString('en-US')}</p>
          </div>
          <div className="rounded-xl bg-black/[0.03] p-3.5">
            <p className="text-[0.66rem] uppercase tracking-wide text-black/40">Unanswered</p>
            <p className="mt-1 font-display text-xl">{ov.aiUnanswered}</p>
          </div>
          <div className="rounded-xl bg-black/[0.03] p-3.5">
            <p className="text-[0.66rem] uppercase tracking-wide text-black/40">Avg session</p>
            <p className="mt-1 font-display text-xl">{fmtDuration(ov.avgSession)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function minsAgo(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}
