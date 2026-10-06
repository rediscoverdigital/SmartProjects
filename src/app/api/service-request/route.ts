import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { track } from '@/lib/analytics';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  restaurantId: z.string().min(1),
  tableId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  kind: z.enum(['call_staff', 'bill', 'water', 'napkins', 'cutlery', 'condiments', 'high_chair', 'other']),
  label: z.string().optional().nullable(),
  note: z.string().max(300).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const d = parsed.data;

  const r = await prisma.restaurant.findUnique({ where: { id: d.restaurantId } });
  if (!r || r.status !== 'active') return NextResponse.json({ error: 'unavailable' }, { status: 403 });
  if (d.kind === 'call_staff' && !r.featCallStaff) return NextResponse.json({ error: 'disabled' }, { status: 403 });
  if (d.kind === 'bill' && !r.featBill) return NextResponse.json({ error: 'disabled' }, { status: 403 });

  const req_ = await prisma.serviceRequest.create({
    data: {
      restaurantId: d.restaurantId,
      tableId: d.tableId || null,
      sessionId: d.sessionId || null,
      kind: d.kind,
      label: d.label || d.kind.replace('_', ' '),
      note: d.note || null,
      status: 'new',
    },
  });

  await track({
    restaurantId: d.restaurantId,
    sessionId: d.sessionId || null,
    tableId: d.tableId || null,
    event: d.kind === 'call_staff' ? 'call_waiter_requested' : d.kind === 'bill' ? 'bill_requested' : 'service_requested',
    entityType: 'service',
    entityLabel: req_.label,
  });

  return NextResponse.json({ ok: true, id: req_.id });
}
