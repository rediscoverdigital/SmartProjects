import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { track } from '@/lib/analytics';
import { z } from 'zod';
import crypto from 'crypto';
import { checkCsrf, checkRateLimit, validateTableId, sanitizeString } from '@/lib/security';

export const dynamic = 'force-dynamic';

const schema = z.object({
  restaurantId: z.string().min(1),
  tableId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  items: z
    .array(z.object({ itemId: z.string(), qty: z.number().int().min(1).max(50) }))
    .min(1)
    .max(40),
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
  if (!r.featOrder) return NextResponse.json({ error: 'ordering_disabled' }, { status: 403 });

  // Validate tableId belongs to this restaurant
  const tableErr = await validateTableId(d.restaurantId, d.tableId);
  if (tableErr) return tableErr;

  // tenant-scoped fetch: only items belonging to this restaurant
  const items = await prisma.menuItem.findMany({
    where: { id: { in: d.items.map((i) => i.itemId) }, restaurantId: d.restaurantId },
  });
  if (!items.length) return NextResponse.json({ error: 'no_valid_items' }, { status: 400 });

  const byId = new Map(items.map((i) => [i.id, i]));
  let total = 0;
  const lines = d.items
    .filter((l) => byId.has(l.itemId))
    .map((l) => {
      const it = byId.get(l.itemId)!;
      total += it.price * l.qty;
      return { itemId: it.id, nameSnapshot: it.name, priceSnapshot: it.price, qty: l.qty };
    });

  // Generate a unique order reference with retry on collision
  let reference = '';
  let order = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    reference = 'SM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    try {
      order = await prisma.order.create({
        data: {
          restaurantId: d.restaurantId,
          tableId: d.tableId || null,
          sessionId: d.sessionId || null,
          reference,
          note: sanitizeString(d.note, 500),
          total,
          status: 'submitted',
          items: {
            create: lines.map((l) => ({
              restaurantId: d.restaurantId,
              itemId: l.itemId,
              nameSnapshot: l.nameSnapshot,
              priceSnapshot: l.priceSnapshot,
              qty: l.qty,
            })),
          },
        },
      });
      break; // success
    } catch (e: any) {
      if (e.code === 'P2002' && attempt < 4) continue; // unique constraint — retry
      throw e;
    }
  }
  if (!order) {
    return NextResponse.json({ error: 'Failed to create order. Please try again.' }, { status: 500 });
  }

  await track({
    restaurantId: d.restaurantId,
    sessionId: d.sessionId || null,
    tableId: d.tableId || null,
    event: 'order_submitted',
    entityType: 'order',
    entityId: order.id,
    entityLabel: reference,
    meta: { total, lines: lines.length },
  });

  return NextResponse.json({ ok: true, id: order.id, reference, total });
}
