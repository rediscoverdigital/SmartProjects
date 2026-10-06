import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { track, touchSession } from '@/lib/analytics';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  restaurantId: z.string().min(1),
  sessionId: z.string().optional().nullable(),
  tableId: z.string().optional().nullable(),
  event: z.string().min(1).max(60),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
  entityLabel: z.string().max(200).optional().nullable(),
  meta: z.record(z.any()).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const d = parsed.data;

  // ensure the session (if any) actually belongs to this restaurant — tenant isolation
  let sessionId = d.sessionId || null;
  if (sessionId) {
    const s = await prisma.session.findFirst({ where: { id: sessionId, restaurantId: d.restaurantId } });
    if (!s) sessionId = null;
    else touchSession(sessionId).catch(() => {});
  }

  await track({
    restaurantId: d.restaurantId,
    sessionId,
    tableId: d.tableId || null,
    event: d.event,
    entityType: d.entityType || null,
    entityId: d.entityId || null,
    entityLabel: d.entityLabel || null,
    meta: d.meta || null,
  });

  return NextResponse.json({ ok: true });
}
