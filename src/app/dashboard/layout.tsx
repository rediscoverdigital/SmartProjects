import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DashShell } from '@/components/dash/DashShell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'super_admin') redirect('/admin');
  if (!user.restaurantId) redirect('/login');

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: user.restaurantId },
    include: { tables: { include: { objects: true }, take: 1 } },
  });
  if (!restaurant) redirect('/login');

  const guestCode = restaurant.tables[0]?.objects[0]?.publicCode ?? null;

  return (
    <DashShell
      restaurantName={restaurant.name}
      plan={restaurant.plan}
      userName={user.name}
      role={user.role}
      guestCode={guestCode}
    >
      {children}
    </DashShell>
  );
}
