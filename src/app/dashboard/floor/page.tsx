import { getCurrentUser } from '@/lib/auth';
import { getServiceRequests } from '@/lib/analytics-queries';
import { FloorBoard } from '@/components/dash/FloorBoard';

export const dynamic = 'force-dynamic';

export default async function FloorPage() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;
  const reqs = await getServiceRequests(user.restaurantId);
  return (
    <FloorBoard
      requests={reqs.map((r) => ({
        id: r.id,
        kind: r.kind,
        label: r.label || r.kind,
        status: r.status,
        note: r.note,
        tableLabel: r.table?.label ?? '—',
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
