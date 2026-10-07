'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, UtensilsCrossed, QrCode, Sparkles, BellRing, MessageSquareHeart,
  BarChart3, Settings, LogOut, Menu, X, ExternalLink, ShoppingBag,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/floor', label: 'Live floor', icon: BellRing },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/menu', label: 'Menu CMS', icon: UtensilsCrossed },
  { href: '/dashboard/tables', label: 'Tables & objects', icon: QrCode },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/ai', label: 'AI assistant', icon: Sparkles },
  { href: '/dashboard/feedback', label: 'Feedback', icon: MessageSquareHeart },
  { href: '/dashboard/branding', label: 'Branding', icon: Settings },
  { href: '/dashboard/staff', label: 'Staff', icon: Settings },
];

export function DashShell({
  children,
  restaurantName,
  plan,
  userName,
  role,
  guestCode,
}: {
  children: React.ReactNode;
  restaurantName: string;
  plan: string;
  userName: string;
  role: string;
  guestCode: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.85rem] font-medium transition ${
              active ? 'bg-white/[0.09] text-white' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/90'
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.4 : 1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="dash-bg flex min-h-screen">
      {/* sidebar (desktop) */}
      <aside className="dash-sidebar sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col py-5 lg:flex">
        <div className="px-6 pb-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brass-400/50">
              <span className="h-2 w-2 rounded-full bg-brass-400" />
            </span>
            <span className="font-display text-[1.05rem]">SmartMenus</span>
          </Link>
        </div>
        <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
          <p className="truncate text-[0.82rem] font-semibold text-white">{restaurantName}</p>
          <p className="mt-0.5 text-[0.66rem] font-semibold uppercase tracking-wider text-brass-400">
            {role} · {plan}
          </p>
        </div>
        {nav}
        <div className="mt-4 space-y-0.5 border-t border-white/10 px-3 pt-3">
          {guestCode && (
            <Link
              href={`/t/${guestCode}`}
              target="_blank"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.82rem] text-white/55 transition hover:bg-white/[0.05] hover:text-white/90"
            >
              <ExternalLink className="h-4 w-4" /> Open guest experience
            </Link>
          )}
          <form action={logoutAction}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.82rem] text-white/55 transition hover:bg-white/[0.05] hover:text-white/90">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="dash-sidebar relative z-10 flex h-full w-[264px] flex-col py-5 anim-in">
            <div className="flex items-center justify-between px-5 pb-5">
              <span className="font-display text-lg">SmartMenus</span>
              <button onClick={() => setOpen(false)} aria-label="close">
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>
            <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <p className="truncate text-[0.82rem] font-semibold text-white">{restaurantName}</p>
              <p className="mt-0.5 text-[0.66rem] font-semibold uppercase tracking-wider text-brass-400">
                {role} · {plan}
              </p>
            </div>
            {nav}
            <div className="mt-4 border-t border-white/10 px-3 pt-3">
              <form action={logoutAction}>
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.82rem] text-white/55">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-black/[0.06] bg-[#f6f5f1]/85 px-5 py-3.5 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden" aria-label="menu">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-black/40">{restaurantName}</p>
              <p className="font-display text-[1.05rem] leading-tight">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {guestCode && (
              <Link
                href={`/t/${guestCode}`}
                target="_blank"
                className="hidden items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-2 text-[0.8rem] font-medium transition hover:border-black/20 sm:flex"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Guest view
              </Link>
            )}
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0c0c0c] text-[0.75rem] font-bold text-white">
                {userName.slice(0, 1)}
              </span>
              <span className="hidden text-[0.82rem] font-medium sm:block">{userName}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
