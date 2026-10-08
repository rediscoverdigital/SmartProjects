import { getCurrentUser, getTvSession } from '@/lib/auth';
import { getServiceRequests } from '@/lib/analytics-queries';

export const dynamic = 'force-dynamic';

/** Resolve the caller from either a dashboard session or a TV token. */
async function resolveCaller(req: Request) {
  const url = new URL(req.url);
  const tvToken = url.searchParams.get('tv');
  if (tvToken) {
    const tv = await getTvSession(tvToken);
    if (tv) return tv;
  }
  return getCurrentUser();
}

function serialize(reqs: Awaited<ReturnType<typeof getServiceRequests>>) {
  return reqs.map((r) => ({
    id: r.id,
    kind: r.kind,
    label: r.label || r.kind,
    status: r.status,
    note: r.note,
    tableLabel: r.table?.label ?? '—',
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function GET(req: Request) {
  const caller = await resolveCaller(req);
  if (!caller?.restaurantId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const url = new URL(req.url);

  // ── SSE stream: pushes updates every 5s, appears instant to the viewer ──
  if (url.searchParams.get('live') === 'sse') {
    const restaurantId = caller.restaurantId;
    let timer: ReturnType<typeof setInterval> | null = null;
    let closed = false;

    const stream = new ReadableStream({
      async start(controller) {
        const push = async () => {
          if (closed) return;
          try {
            const reqs = await getServiceRequests(restaurantId);
            controller.enqueue(`data: ${JSON.stringify(serialize(reqs))}\n\n`);
          } catch {
            // swallow — next tick retries
          }
        };
        controller.enqueue(`: connected\n\n`);
        await push();
        // 2s cadence: feels instant on a floor screen while staying cheap
        // (one indexed query per connected display).
        timer = setInterval(push, 2_000);
      },
      cancel() {
        closed = true;
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // ── Plain JSON (dashboard + fallback polling) ──
  const reqs = await getServiceRequests(caller.restaurantId);
  return new Response(JSON.stringify(serialize(reqs)), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
