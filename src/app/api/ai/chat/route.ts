import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateAnswer } from '@/lib/ai';
import { track } from '@/lib/analytics';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  restaurantId: z.string().min(1),
  sessionId: z.string().optional().nullable(),
  conversationId: z.string().optional().nullable(),
  question: z.string().min(1).max(600),
  language: z.enum(['en', 'fr']).default('en'),
});

/**
 * Rate-limited AI endpoint. Grounded strictly in restaurant data.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

// Periodically prune stale entries to prevent unbounded memory growth
const pruneInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, arr] of hits) {
    const fresh = arr.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}, 5 * 60_000); // every 5 minutes
// Don't keep the Node process alive just for this timer
if (typeof pruneInterval === 'object' && 'unref' in pruneInterval) {
  (pruneInterval as NodeJS.Timeout).unref();
}

function rateLimited(key: string) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { restaurantId, sessionId, conversationId, question, language } = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant || restaurant.status !== 'active' || !restaurant.featAi) {
    return NextResponse.json({ error: 'unavailable' }, { status: 403 });
  }
  if (rateLimited(`${ip}:${restaurantId}`)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const result = await generateAnswer(restaurantId, language, question);

  // persist conversation
  let convoId = conversationId || null;
  if (!convoId) {
    const c = await prisma.aiConversation.create({
      data: { restaurantId, sessionId: sessionId || null, language, title: question.slice(0, 80) },
    });
    convoId = c.id;
  }
  await prisma.aiMessage.create({
    data: { restaurantId, conversationId: convoId, role: 'user', content: question },
  });
  await prisma.aiMessage.create({
    data: {
      restaurantId,
      conversationId: convoId,
      role: 'assistant',
      content: result.answer,
      groundedOn: JSON.stringify(result.groundedOn),
      unanswered: result.unanswered,
    },
  });
  await prisma.aiConversation.update({
    where: { id: convoId },
    data: { lastMsgAt: new Date(), msgCount: { increment: 2 } },
  });

  await track({
    restaurantId,
    sessionId: sessionId || null,
    event: 'ai_question_submitted',
    entityType: 'ai',
    entityLabel: question.slice(0, 120),
    meta: { unanswered: result.unanswered, grounded: result.groundedOn.length },
  });

  return NextResponse.json({
    answer: result.answer,
    suggestedItems: result.suggestedItems,
    unanswered: result.unanswered,
    conversationId: convoId,
  });
}
