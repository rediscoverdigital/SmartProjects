import { prisma } from './db';

// ───────────────────────────────────────────────────────────
// Dashboard analytics queries — all tenant-scoped.
// ───────────────────────────────────────────────────────────

export type Range = 'today' | '7d' | '30d' | '90d';

export function rangeStart(range: Range): Date {
  const d = new Date();
  if (range === 'today') {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return new Date(Date.now() - days * 864e5);
}

export async function getOverview(restaurantId: string, range: Range = 'today') {
  const since = rangeStart(range);

  const [sessions, scans, menuViews, aiConvos, serviceReqs, feedbackCount, aiUnanswered] =
    await Promise.all([
      prisma.session.count({ where: { restaurantId, startedAt: { gte: since } } }),
      prisma.interaction.count({ where: { restaurantId, event: { in: ['nfc_scan', 'qr_scan'] }, createdAt: { gte: since } } }),
      prisma.interaction.count({ where: { restaurantId, event: 'menu_opened', createdAt: { gte: since } } }),
      prisma.aiConversation.count({ where: { restaurantId, startedAt: { gte: since } } }),
      prisma.serviceRequest.count({ where: { restaurantId, createdAt: { gte: since } } }),
      prisma.feedback.count({ where: { restaurantId, createdAt: { gte: since } } }),
      prisma.aiMessage.count({ where: { restaurantId, unanswered: true, createdAt: { gte: since } } }),
    ]);

  const avg = await prisma.session.aggregate({
    where: { restaurantId, startedAt: { gte: since } },
    _avg: { durationSec: true },
  });

  // acquisition split
  const [nfc, qr] = await Promise.all([
    prisma.interaction.count({ where: { restaurantId, event: 'nfc_scan', createdAt: { gte: since } } }),
    prisma.interaction.count({ where: { restaurantId, event: 'qr_scan', createdAt: { gte: since } } }),
  ]);

  return {
    sessions,
    scans,
    menuViews,
    aiConvos,
    serviceReqs,
    feedbackCount,
    aiUnanswered,
    avgSession: Math.round(avg._avg.durationSec || 0),
    nfc,
    qr,
    nfcPct: nfc + qr > 0 ? Math.round((nfc / (nfc + qr)) * 100) : 0,
  };
}

export async function getTopViewed(restaurantId: string, range: Range = '30d', limit = 6) {
  const since = rangeStart(range);
  const rows = await prisma.interaction.groupBy({
    by: ['entityId', 'entityLabel'],
    where: { restaurantId, event: 'item_viewed', entityId: { not: null }, createdAt: { gte: since } },
    _count: { entityId: true },
    orderBy: { _count: { entityId: 'desc' } },
    take: limit,
  });
  return rows.map((r) => ({ id: r.entityId!, label: r.entityLabel || 'Item', count: r._count.entityId }));
}

export async function getTopSearches(restaurantId: string, range: Range = '30d', limit = 8) {
  const since = rangeStart(range);
  const rows = await prisma.interaction.groupBy({
    by: ['entityLabel'],
    where: { restaurantId, event: 'search_completed', entityLabel: { not: null }, createdAt: { gte: since } },
    _count: { entityLabel: true },
    orderBy: { _count: { entityLabel: 'desc' } },
    take: limit,
  });
  return rows.map((r) => ({ label: r.entityLabel!, count: r._count.entityLabel }));
}

export async function getTopAiQuestions(restaurantId: string, range: Range = '30d', limit = 6) {
  const since = rangeStart(range);
  const rows = await prisma.aiMessage.findMany({
    where: { restaurantId, role: 'user', createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 40,
    select: { content: true, createdAt: true },
  });
  const seen = new Map<string, number>();
  for (const r of rows) {
    const key = r.content.trim().slice(0, 90);
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  return [...seen.entries()]
    .map(([q, n]) => ({ q, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, limit);
}

export async function getTableActivity(restaurantId: string, range: Range = '30d') {
  const since = rangeStart(range);
  const tables = await prisma.tableObj.findMany({
    where: { restaurantId },
    include: { location: true, objects: true },
    orderBy: { label: 'asc' },
  });
  const scans = await prisma.interaction.groupBy({
    by: ['tableId'],
    where: { restaurantId, event: { in: ['nfc_scan', 'qr_scan'] }, createdAt: { gte: since }, tableId: { not: null } },
    _count: { tableId: true },
  });
  const map = new Map(scans.map((s) => [s.tableId, s._count.tableId]));
  return tables.map((t) => ({
    id: t.id,
    label: t.label,
    location: t.location?.name ?? '—',
    scans: map.get(t.id) || 0,
    status: t.status,
    objects: t.objects.map((o) => ({ code: o.publicCode, status: o.status, lastScanAt: o.lastScanAt, type: o.objectType })),
  }));
}

export async function getDailySeries(restaurantId: string, range: Range = '30d') {
  const since = rangeStart(range);
  const sessions = await prisma.session.findMany({
    where: { restaurantId, startedAt: { gte: since } },
    select: { startedAt: true },
  });
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const buckets: { label: string; date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, date: d.toISOString().slice(0, 10), count: 0 });
  }
  const idx = new Map(buckets.map((b, i) => [b.date, i]));
  for (const s of sessions) {
    const key = s.startedAt.toISOString().slice(0, 10);
    const i = idx.get(key);
    if (i !== undefined) buckets[i].count++;
  }
  return buckets;
}

export async function getFeedbackSummary(restaurantId: string) {
  const [agg, list] = await Promise.all([
    prisma.feedback.aggregate({ where: { restaurantId }, _avg: { rating: true }, _count: true }),
    prisma.feedback.findMany({
      where: { restaurantId },
      include: { table: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);
  return {
    average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
    count: agg._count,
    list,
  };
}

export async function getServiceRequests(restaurantId: string, status?: string) {
  return prisma.serviceRequest.findMany({
    where: { restaurantId, ...(status ? { status } : {}) },
    include: { table: true },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });
}

export async function getAiUsage(restaurantId: string) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const convos = await prisma.aiConversation.count({ where: { restaurantId, startedAt: { gte: start } } });
  const msgs = await prisma.aiMessage.count({ where: { restaurantId, createdAt: { gte: start } } });
  const unanswered = await prisma.aiMessage.count({ where: { restaurantId, unanswered: true, createdAt: { gte: start } } });
  return { convos, msgs, unanswered, groundingRate: msgs > 0 ? Math.round(((msgs / 2 - unanswered) / (msgs / 2)) * 100) : 100 };
}
