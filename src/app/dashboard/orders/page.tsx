import { getCurrentUser } from '@/lib/auth';
import { getOrders } from '@/lib/analytics-queries';
import { OrdersBoard } from '@/components/dash/OrdersBoard';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;

  const orders = await getOrders(user.restaurantId);

  return (
    <OrdersBoard
      orders={orders.map((o) => ({
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
      }))}
    />
  );
}
