import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { track } from '@/lib/analytics';
import { z } from 'zod';
import { checkCsrf, checkRateLimit, validateTableId, sanitizeString, validateRating } from '@/lib/security';

export const dynamic = 'force-dynamic';

const schema = z.object({
  restaurantId: z.string().min(1),
  tableId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  // CSRF protection
  const csrf = checkCsrf(req);
  if (csrf) return csrf;

  // Rate limiting
  const rate = checkRateLimit(req);
  if (rate) return rate;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const d = parsed.data;

  const r = await prisma.restaurant.findUnique({ where: { id: d.restaurantId } });
  if (!r || r.status !== 'active') return NextResponse.json({ error: 'unavailable' }, { status: 403 });
  if (!r.featFeedback) return NextResponse.json({ error: 'disabled' }, { status: 403 });

  // Validate tableId belongs to this restaurant
  const tableErr = await validateTableId(d.restaurantId, d.tableId);
  if (tableErr) return tableErr;

  // Validate rating bounds
  if (!validateRating(d.rating)) return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });

  const fb = await prisma.feedback.create({
    data: {
      restaurantId: d.restaurantId,
      tableId: d.tableId || null,
      sessionId: d.sessionId || null,
      rating: d.rating,
      comment: sanitizeString(d.comment, 1000),
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
