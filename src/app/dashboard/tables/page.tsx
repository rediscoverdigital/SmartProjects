import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TablesBoard } from '@/components/dash/TablesBoard';

export const dynamic = 'force-dynamic';

export default async function TablesPage() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;
  const rid = user.restaurantId;

  const [tables, locations] = await Promise.all([
    prisma.tableObj.findMany({
      where: { restaurantId: rid },
      include: { location: true, objects: { orderBy: { createdAt: 'desc' } } },
      orderBy: { label: 'asc' },
    }),
    prisma.location.findMany({ where: { restaurantId: rid }, orderBy: { displayOrder: 'asc' } }),
  ]);

  return (
    <TablesBoard
      tables={tables.map((t) => ({
        id: t.id,
        label: t.label,
        seats: t.seats,
        status: t.status,
        locationId: t.locationId,
        locationName: t.location?.name ?? null,
        objects: t.objects.map((o) => ({
          id: o.id,
          publicCode: o.publicCode,
          nfcUid: o.nfcUid,
          objectType: o.objectType,
          status: o.status,
          lastScanAt: o.lastScanAt ? o.lastScanAt.toISOString() : null,
          scanCount: o.scanCount,
        })),
      }))}
      locations={locations.map((l) => ({ id: l.id, name: l.name, kind: l.kind }))}
    />
  );
}
