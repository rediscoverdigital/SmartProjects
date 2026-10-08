import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ── CSRF / Origin check ─────────────────────────────────────
/** Reject cross-origin POST requests from untrusted sites.
 *  Returns a 403 response if the origin is not allowed, null if OK.
 */
export function checkCsrf(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  // No origin header = same-origin or non-browser client (curl, etc.) — allow
  if (!origin) return null;
  // Allow same-origin requests
  if (origin === `http://${host}` || origin === `https://${host}`) return null;
  // Allow localhost variants in development
  if (process.env.NODE_ENV !== 'production') {
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return null;
  }
  return NextResponse.json({ error: 'Cross-origin request rejected' }, { status: 403 });
}

// ── Rate limiting ───────────────────────────────────────────
// Simple in-memory sliding window. For multi-instance, use Redis.
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_MAX = 30; // max requests per window per IP
const rateMap = new Map<string, number[]>();

export function checkRateLimit(req: NextRequest, max = RATE_MAX): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const attempts = (rateMap.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (attempts.length >= max) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }
  attempts.push(now);
  rateMap.set(ip, attempts);
  return null;
}

// ── tableId validation ──────────────────────────────────────
/** Ensure a tableId belongs to the given restaurant.
 *  Returns an error response if invalid, null if OK.
 */
export async function validateTableId(
  restaurantId: string,
  tableId: string | null | undefined,
): Promise<NextResponse | null> {
  if (!tableId) return null; // null/undefined is fine
  const table = await prisma.tableObj.findFirst({
    where: { id: tableId, restaurantId },
    select: { id: true },
  });
  if (!table) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }
  return null;
}

// ── Input sanitization ──────────────────────────────────────
/** Strip HTML tags and trim a string field. */
export function sanitizeString(s: string | null | undefined, maxLen = 500): string | null {
  if (!s) return null;
  // Strip HTML tags
  const stripped = s.replace(/<[^>]*>/g, '').trim();
  return stripped.slice(0, maxLen) || null;
}

/** Validate a rating is an integer 1-5. */
export function validateRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}
