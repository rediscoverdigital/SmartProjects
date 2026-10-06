import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { track } from '@/lib/analytics';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  restaurantId: z.string().min(1),
  tableId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const d = parsed.data;

  const r = await prisma.restaurant.findUnique({ where: { id: d.restaurantId } });
  if (!r || !r.featFeedback) return NextResponse.json({ error: 'disabled' }, { status: 403 });

  const fb = await prisma.feedback.create({
    data: {
      restaurantId: d.restaurantId,
      tableId: d.tableId || null,
      sessionId: d.sessionId || null,
      rating: d.rating,
      comment: d.comment || null,
    },
  });

  await track({
    restaurantId: d.restaurantId,
    sessionId: d.sessionId || null,
    tableId: d.tableId || null,
    event: 'feedback_submitted',
    entityType: 'feedback',
    meta: { rating: d.rating },
  });

  return NextResponse.json({ ok: true, id: fb.id });
}
