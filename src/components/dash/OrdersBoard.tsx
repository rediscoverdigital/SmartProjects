'use client';

import { useTransition, useState, useEffect, useCallback } from 'react';
import { updateOrderStatus } from '@/app/actions/dashboard';
import { StatusPill, Empty, SectionHeading, StatCard } from './ui';
import { ShoppingBag, Check, X, Loader2, RefreshCw, IndianRupee, Clock, ChefHat, Utensils } from 'lucide-react';

export type OrderLine = { id: string; nameSnapshot: string; priceSnapshot: number; qty: number };
export type OrderRow = {
  id: string;
  reference: string;
  status: string;
  note: string | null;
  total: number;
  tableLabel: string;
  createdAt: string;
  items: OrderLine[];
};

const REFRESH_INTERVAL_MS = 120_000; // 2 minutes

export function OrdersBoard({ orders: initialOrders }: { orders: OrderRow[] }) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  // keep relative times fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data: OrderRow[] = await res.json();
        setOrders(data);
        setLastRefresh(new Date());
      }
    } catch {
      // keep last known state on transient errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const open = orders.filter((o) => o.status === 'submitted' || o.status === 'acknowledged');
  const closed = orders.filter((o) => o.status === 'served' || o.status === 'cancelled');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = orders.filter((o) => new Date(o.createdAt) >= todayStart);
  const revenueToday = today.filter((o) => o.status !== 'cancelled').reduce((n, o) => n + o.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[1.5rem]">Orders</h1>
        <p className="text-[0.82rem] text-black/45">
          {open.length} open {open.length === 1 ? 'order' : 'orders'} · {today.length} placed today
        </p>
        <div className="mt-2 flex items-center gap-2 text-[0.72rem] text-black/40">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          <span>
            {lastRefresh
              ? `Auto-refreshing every 2 min · last updated ${lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
              : 'Setting up live updates…'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Open orders" value={open.length} icon={ShoppingBag} tone={open.length > 0 ? 'warn' : 'default'} />
        <StatCard label="Orders today" value={today.length} icon={Clock} />
        <StatCard label="Revenue today" value={`Rs ${revenueToday.toLocaleString('en-US')}`} icon={IndianRupee} tone="gold" />
      </div>

      {open.length === 0 ? (
        <div className="dash-card">
          <Empty
            icon={ShoppingBag}
            title="No open orders"
            body="When a guest places an order from their table, it appears here within 2 minutes."
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {open.map((o) => (
            <OrderCard key={o.id} order={o} onChanged={refresh} />
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <div>
          <SectionHeading title="Completed & cancelled" />
          <div className="dash-card divide-y divide-black/[0.05]">
            {closed.slice(0, 20).map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-3 opacity-70">
                <span className="font-mono text-[0.78rem] font-semibold">{o.reference}</span>
                <span className="text-[0.85rem] font-semibold">{o.tableLabel}</span>
                <span className="text-[0.78rem] text-black/45">{o.items.length} {o.items.length === 1 ? 'line' : 'lines'}</span>
                <span className="ml-auto text-[0.7rem] text-black/35">{ago(o.createdAt)}</span>
                <span className="tabular-nums text-[0.8rem] text-black/60">Rs {o.total.toLocaleString('en-US')}</span>
                <StatusPill status={o.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onChanged }: { order: OrderRow; onChanged: () => Promise<void> }) {
  const [pending, start] = useTransition();
  const isNew = order.status === 'submitted';

  const act = (status: 'acknowledged' | 'served' | 'cancelled') =>
    start(async () => {
      await updateOrderStatus(order.id, status);
      await onChanged();
    });

  return (
    <div className={`dash-card p-4 ${isNew ? 'ring-2 ring-[#C25E1E]/25' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[0.78rem] font-semibold text-black/70">{order.reference}</p>
          <p className="mt-1 font-display text-[1.2rem]">{order.tableLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-[0.7rem] text-black/40">{ago(order.createdAt)}</p>
          <div className="mt-1"><StatusPill status={order.status} /></div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-black/[0.06] pt-3">
        {order.items.map((l) => (
          <div key={l.id} className="flex items-baseline justify-between gap-3 text-[0.82rem]">
            <span className="text-black/75">
              <span className="font-semibold text-black/50">{l.qty}×</span> {l.nameSnapshot}
            </span>
            <span className="shrink-0 tabular-nums text-black/50">
              Rs {(l.priceSnapshot * l.qty).toLocaleString('en-US')}
            </span>
          </div>
        ))}
      </div>

      {order.note && (
        <p className="mt-2.5 rounded-lg bg-[#C25E1E]/[0.07] px-2.5 py-1.5 text-[0.78rem] italic text-[#8a4214]">
          “{order.note}”
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-black/[0.06] pt-3">
        <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-black/40">Total</span>
        <span className="font-display text-[1.15rem]">Rs {order.total.toLocaleString('en-US')}</span>
      </div>

      <div className="mt-3 flex gap-2">
        {isNew ? (
          <>
            <button
              onClick={() => act('acknowledged')}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white py-2.5 text-[0.8rem] font-semibold transition hover:border-black/25 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChefHat className="h-3.5 w-3.5" />} Accept
            </button>
            <button
              onClick={() => act('cancelled')}
              disabled={pending}
              className="flex items-center justify-center gap-1.5 rounded-full border border-red-200 px-3 py-2.5 text-[0.8rem] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
              title="Cancel order"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => act('served')}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#0c0c0c] py-2.5 text-[0.8rem] font-semibold text-white transition hover:bg-black disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Utensils className="h-3.5 w-3.5" />} Mark served
            </button>
            <button
              onClick={() => act('cancelled')}
              disabled={pending}
              className="flex items-center justify-center gap-1.5 rounded-full border border-red-200 px-3 py-2.5 text-[0.8rem] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
              title="Cancel order"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
