import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startSession } from '@/lib/analytics';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  code: z.string().min(3).max(32),
  source: z.enum(['nfc', 'qr', 'url']).default('qr'),
  language: z.enum(['en', 'fr']).default('en'),
});

/**
 * Resolve an opaque public code to a table + restaurant, and open an
 * anonymous session. This is the entry point for every NFC tap / QR scan.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { code, source, language } = parsed.data;

  const object = await prisma.physicalObject.findUnique({
    where: { publicCode: code },
    include: { table: true, restaurant: true },
  });

  if (!object || !object.restaurant) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (object.status === 'suspended' || object.status === 'lost') {
    return NextResponse.json({ error: 'unavailable' }, { status: 410 });
  }
  if (object.restaurant.status !== 'active') {
    return NextResponse.json({ error: 'suspended' }, { status: 403 });
  }

  const session = await startSession({
    restaurantId: object.restaurantId,
    tableId: object.tableId,
    objectId: object.id,
    source,
    language,
    userAgent: req.headers.get('user-agent'),
  });

  return NextResponse.json({
    sessionId: session.id,
    sessionToken: session.token,
    restaurantId: object.restaurantId,
    restaurantSlug: object.restaurant.slug,
    restaurantName: object.restaurant.name,
    tableId: object.tableId,
    tableLabel: object.table?.label ?? null,
    objectType: object.objectType,
  });
}
