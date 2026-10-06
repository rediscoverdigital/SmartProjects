import { prisma } from './db';

// Server-side analytics recorder. Keeps capture minimal and privacy-conscious:
// no personal data, only anonymous session tokens.

export type TrackInput = {
  restaurantId: string;
  sessionId?: string | null;
  tableId?: string | null;
  objectId?: string | null;
  event: string;
  entityType?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  meta?: Record<string, unknown> | null;
};

export async function track(input: TrackInput) {
  try {
    await prisma.interaction.create({
      data: {
        restaurantId: input.restaurantId,
        sessionId: input.sessionId ?? null,
        tableId: input.tableId ?? null,
        objectId: input.objectId ?? null,
        event: input.event,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        entityLabel: input.entityLabel ?? null,
        meta: input.meta ? JSON.stringify(input.meta) : null,
      },
    });
  } catch {
    // analytics must never break the guest experience
  }
}

export async function startSession(opts: {
  restaurantId: string;
  tableId?: string | null;
  objectId?: string | null;
  source: string;
  language: string;
  userAgent?: string | null;
}) {
  const token = crypto.randomUUID();
  const session = await prisma.session.create({
    data: {
      restaurantId: opts.restaurantId,
      tableId: opts.tableId ?? null,
      objectId: opts.objectId ?? null,
      token,
      source: opts.source,
      language: opts.language,
      userAgent: opts.userAgent?.slice(0, 300) ?? null,
    },
  });
  await track({
    restaurantId: opts.restaurantId,
    sessionId: session.id,
    tableId: opts.tableId ?? null,
    objectId: opts.objectId ?? null,
    event: opts.source === 'nfc' ? 'nfc_scan' : 'qr_scan',
  });
  await track({
    restaurantId: opts.restaurantId,
    sessionId: session.id,
    tableId: opts.tableId ?? null,
    event: 'session_started',
  });
  if (opts.objectId) {
    await prisma.physicalObject.update({
      where: { id: opts.objectId },
      data: { lastScanAt: new Date(), scanCount: { increment: 1 } },
    }).catch(() => {});
  }
  return session;
}

export async function touchSession(sessionId: string, extraSec = 0) {
  const s = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!s) return;
  const now = new Date();
  const duration = Math.floor((now.getTime() - s.startedAt.getTime()) / 1000);
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      lastSeenAt: now,
      durationSec: duration,
      pageViews: { increment: extraSec ? 0 : 1 },
    },
  }).catch(() => {});
}
