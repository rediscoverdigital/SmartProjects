import { getTvSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: { token?: string; requestId?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { token, requestId, status } = body;
  if (!token || !requestId || !status) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (status !== 'acknowledged' && status !== 'resolved') {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  const session = await getTvSession(token);
  if (!session?.restaurantId) {
    return Response.json({ error: 'Invalid TV link' }, { status: 401 });
  }

  // Tenant-scoped: the request must belong to this restaurant.
  const existing = await prisma.serviceRequest.findFirst({
    where: { id: requestId, restaurantId: session.restaurantId },
  });
  if (!existing) {
    return Response.json({ error: 'Request not found' }, { status: 404 });
  }

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { status, resolvedAt: status === 'resolved' ? new Date() : null },
  });

  await prisma.auditLog.create({
    data: {
      restaurantId: session.restaurantId,
      actorId: session.id,
      actorEmail: session.email,
      action: `service.${status}`,
      entityType: 'ServiceRequest',
      entityId: requestId,
      detail: 'via TV view',
    },
  }).catch(() => {});

  return Response.json({ ok: true, status });
}
