import { getCurrentUser } from '@/lib/auth';
import { getServiceRequests } from '@/lib/analytics-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

  const reqs = await getServiceRequests(user.restaurantId);
  return new Response(
    JSON.stringify(
      reqs.map((r) => ({
        id: r.id,
        kind: r.kind,
        label: r.label || r.kind,
        status: r.status,
        note: r.note,
        tableLabel: r.table?.label ?? '—',
        createdAt: r.createdAt.toISOString(),
      }))
    ),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
