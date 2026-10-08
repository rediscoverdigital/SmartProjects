import { getCurrentUser } from '@/lib/auth';
import { getServiceRequests } from '@/lib/analytics-queries';
import { prisma } from '@/lib/db';
import { FloorBoard } from '@/components/dash/FloorBoard';

export const dynamic = 'force-dynamic';

export default async function FloorPage() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;

  const [reqs, restaurant] = await Promise.all([
    getServiceRequests(user.restaurantId),
    prisma.restaurant.findUnique({
      where: { id: user.restaurantId },
      select: { tvToken: true },
    }),
  ]);

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
      tvToken={restaurant?.tvToken ?? null}
    />
  );
}
