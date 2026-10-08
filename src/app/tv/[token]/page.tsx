import { getTvSession } from '@/lib/auth';
import { getServiceRequests } from '@/lib/analytics-queries';
import { TvFloor } from '@/components/tv/TvFloor';

export const dynamic = 'force-dynamic';

export default async function TvPage({ params }: { params: { token: string } }) {
  const session = await getTvSession(params.token);

  if (!session?.restaurantId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0c0c0c] text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#C25E1E]">Link not valid</h1>
          <p className="mt-2 text-white/60">
            This TV link has been revoked or never existed. Ask an owner to generate a new one.
          </p>
        </div>
      </div>
    );
  }

  const requests = await getServiceRequests(session.restaurantId);
  const initial = requests
    .filter((r) => r.status === 'new' || r.status === 'acknowledged')
    .map((r) => ({
      id: r.id,
      kind: r.kind,
      label: r.label || r.kind,
      status: r.status,
      note: r.note,
      tableLabel: r.table?.label ?? '—',
      createdAt: r.createdAt.toISOString(),
    }));

  return <TvFloor token={params.token} restaurantName={session.name} initialRequests={initial} />;
}
