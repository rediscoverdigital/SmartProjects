import { getCurrentUser } from '@/lib/auth';
import { getOrders } from '@/lib/analytics-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

  const orders = await getOrders(user.restaurantId);
  return new Response(
    JSON.stringify(
      orders.map((o) => ({
        id: o.id,
        reference: o.reference,
        status: o.status,
        note: o.note,
        total: o.total,
        tableLabel: o.table?.label ?? '—',
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((l) => ({
          id: l.id,
          nameSnapshot: l.nameSnapshot,
          priceSnapshot: l.priceSnapshot,
          qty: l.qty,
        })),
      }))
    ),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
