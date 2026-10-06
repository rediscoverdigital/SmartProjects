import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StaffManager } from '@/components/dash/StaffManager';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;
  const users = await prisma.user.findMany({
    where: { restaurantId: user.restaurantId },
    orderBy: { createdAt: 'asc' },
  });
  return (
    <StaffManager
      currentUserId={user.id}
      canManage={user.role === 'owner'}
      users={users.map((u) => ({
        id: u.id, name: u.name, email: u.email, role: u.role, status: u.status,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        permissions: u.permissions,
      }))}
    />
  );
}
