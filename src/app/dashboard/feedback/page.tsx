import { getCurrentUser } from '@/lib/auth';
import { getFeedbackSummary } from '@/lib/analytics-queries';
import { SectionHeading, Empty } from '@/components/dash/ui';
import { Star, MessageSquareHeart, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;
  const fb = await getFeedbackSummary(user.restaurantId);

  const dist = [5, 4, 3, 2, 1].map((r) => ({ r, n: fb.list.filter((f) => f.rating === r).length }));
  const positive = fb.list.filter((f) => f.rating >= 4).length;
  const nps = fb.count ? Math.round((positive / fb.count) * 100) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-[1.5rem]">Feedback</h1>
        <p className="text-[0.82rem] text-black/45">Internal first. Public review CTAs only after a warm rating.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="dash-card flex items-center gap-5 p-5">
          <span className="font-display text-[3rem] leading-none">{fb.average || '—'}</span>
          <div>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4" fill={i < Math.round(fb.average) ? '#8E7642' : 'none'} stroke="#8E7642" />
              ))}
            </div>
            <p className="mt-1.5 text-[0.78rem] text-black/45">{fb.count} responses</p>
          </div>
        </div>

        <div className="dash-card p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">Warm rating rate</p>
          <p className="mt-2 font-display text-[2rem] leading-none text-[#4F5C46]">{nps}%</p>
          <p className="mt-1.5 text-[0.72rem] text-black/45">4★ and above · eligible for a review CTA</p>
        </div>

        <div className="dash-card p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-black/40">Distribution</p>
          <div className="mt-3 space-y-1.5">
            {dist.map(({ r, n }) => (
              <div key={r} className="flex items-center gap-2 text-[0.75rem]">
                <span className="w-3 text-black/45">{r}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                  <div className="h-full rounded-full bg-[#8E7642]" style={{ width: `${fb.count ? (n / fb.count) * 100 : 0}%` }} />
                </div>
                <span className="w-6 text-right tabular-nums text-black/40">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-card p-5">
        <SectionHeading title="Recent feedback" />
        {fb.list.length === 0 ? (
          <Empty icon={MessageSquareHeart} title="No feedback yet" body="Feedback from your guests will appear here." />
        ) : (
          <div className="space-y-2.5">
            {fb.list.map((f) => (
              <div key={f.id} className="rounded-xl border border-black/[0.06] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5" fill={i < f.rating ? '#8E7642' : 'none'} stroke="#8E7642" />
                      ))}
                    </div>
                    <span className="text-[0.8rem] font-semibold">{f.table?.label ?? 'Table'}</span>
                  </div>
                  <span className="text-[0.72rem] text-black/40">{when(f.createdAt)}</span>
                </div>
                {f.comment && <p className="mt-2 text-[0.85rem] text-black/70">“{f.comment}”</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function when(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / 1440)}d ago`;
}
