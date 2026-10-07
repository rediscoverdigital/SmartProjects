import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { StatCard, SectionHeading, BarList, StatusPill } from '@/components/dash/ui';
import { CreateTenantForm } from '@/components/dash/CreateTenantForm';
import { TenantUsersPanel } from '@/components/dash/TenantUsersPanel';
import { logoutAction } from '@/app/actions/auth';
import { createTenant, suspendTenant, resetUserPassword, updateUserStatus } from '@/app/actions/dashboard';
import { Plus, Building2, Users, QrCode, Sparkles, TrendingUp, ExternalLink, LogOut, IndianRupee, Copy, CheckCircle, MoreVertical, Ban, Unlock, Key, Eye, EyeOff } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'super_admin') redirect('/dashboard');

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [restaurants, users, objects, aiConvos, subs, allItems, tenantUsers] = await Promise.all([
    prisma.restaurant.findMany({ include: { _count: { select: { items: true, tables: true, sessions: true, users: true } } }, orderBy: { createdAt: 'asc' } }),
    prisma.user.count(),
    prisma.physicalObject.count(),
    prisma.aiConversation.count({ where: { startedAt: { gte: monthStart } } }),
    prisma.subscription.findMany(),
    prisma.menuItem.count(),
    prisma.user.findMany({
      where: { restaurantId: { not: null } },
      include: { restaurant: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const mrr = subs.filter((s) => s.status === 'active').reduce((n, s) => n + s.monthlyPrice, 0);

  return (
    <div className="dash-bg min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/[0.06] bg-[#f6f5f1]/85 px-5 py-3.5 backdrop-blur-xl lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#8E7642]/50">
            <span className="h-2 w-2 rounded-full bg-[#8E7642]" />
          </span>
          <div>
            <p className="text-[0.66rem] font-semibold uppercase tracking-wider text-black/40">SmartMenus</p>
            <p className="font-display text-[1.05rem] leading-tight">Platform admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[0.82rem] text-black/60 sm:block">{user.name}</span>
          <form action={logoutAction}>
            <button className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-[0.8rem] font-medium transition hover:border-black/20">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Restaurants" value={restaurants.length} icon={Building2} />
          <StatCard label="Monthly revenue" value={`Rs ${mrr.toLocaleString('en-US')}`} icon={IndianRupee} tone="gold" hint={`${subs.filter((s) => s.status === 'active').length} active subs`} />
          <StatCard label="AI conversations (mo)" value={aiConvos} icon={Sparkles} />
          <StatCard label="Physical objects" value={objects} icon={QrCode} />
        </div>

        <CreateTenantForm />

        <div className="dash-card overflow-hidden">
          <div className="border-b border-black/[0.06] px-5 py-4">
            <SectionHeading title="Tenants" action={<span className="text-[0.75rem] text-black/40">{users} users · {allItems} items</span>} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.85rem]">
              <thead>
                <tr className="border-b border-black/[0.06] text-[0.66rem] uppercase tracking-wider text-black/40">
                  <th className="px-5 py-3 font-semibold">Restaurant</th>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="hidden px-5 py-3 font-semibold sm:table-cell">Items</th>
                  <th className="hidden px-5 py-3 font-semibold sm:table-cell">Tables</th>
                  <th className="hidden px-5 py-3 font-semibold md:table-cell">Sessions</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Guest view</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {restaurants.map((r) => (
                  <tr key={r.id} className="transition hover:bg-black/[0.02]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-6 w-1.5 rounded-full" style={{ background: r.accentColor }} />
                        <div>
                          <p className="font-semibold">{r.name}</p>
                          <p className="text-[0.72rem] text-black/40">/{r.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[0.68rem] font-bold uppercase">{r.plan}</span></td>
                    <td className="hidden px-5 py-3.5 tabular-nums text-black/60 sm:table-cell">{r._count.items}</td>
                    <td className="hidden px-5 py-3.5 tabular-nums text-black/60 sm:table-cell">{r._count.tables}</td>
                    <td className="hidden px-5 py-3.5 tabular-nums text-black/60 md:table-cell">{r._count.sessions.toLocaleString('en-US')}</td>
                    <td className="px-5 py-3.5"><StatusPill status={r.status} /></td>
                    <td className="px-5 py-3.5">
                      <Link href={`/t/${r.slug === 'cote-sauvage' ? 'T8SAUV' : r.slug === 'harbour-co' ? 'T3HARB' : 'T1ATEL'}`} target="_blank" className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-[#8E7642]">
                        Open <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <form action={suspendTenant}>
                        <input type="hidden" name="restaurantId" value={r.id} />
                        <input type="hidden" name="suspend" value={r.status === 'active' ? 'true' : 'false'} />
                        <button
                          type="submit"
                          className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-1 text-[0.68rem] font-bold uppercase transition ${
                            r.status === 'active'
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-green-200 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {r.status === 'active' ? <Ban className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          {r.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="dash-card p-5">
            <SectionHeading title="Sessions by tenant" />
            <BarList items={restaurants.map((r) => ({ label: r.name, count: r._count.sessions }))} />
          </div>
          <div className="dash-card p-5">
            <SectionHeading title="Subscriptions" />
            <div className="space-y-2.5">
              {subs.map((s) => {
                const r = restaurants.find((x) => x.id === s.restaurantId);
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-black/[0.06] px-4 py-3">
                    <div>
                      <p className="text-[0.85rem] font-semibold">{r?.name}</p>
                      <p className="text-[0.72rem] capitalize text-black/45">{s.plan} · renews {s.renewsAt ? new Date(s.renewsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-[1.05rem]">Rs {s.monthlyPrice.toLocaleString('en-US')}</p>
                      <p className="text-[0.68rem] capitalize text-black/40">{s.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="dash-card overflow-hidden">
          <div className="border-b border-black/[0.06] px-5 py-4">
            <SectionHeading title="Tenant users" action={<span className="text-[0.75rem] text-black/40">{tenantUsers.length} total</span>} />
          </div>
          <TenantUsersPanel
            users={tenantUsers.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              status: u.status,
              restaurantName: u.restaurant?.name ?? null,
              restaurantSlug: u.restaurant?.slug ?? null,
            }))}
          />
        </div>

        <p className="pb-6 text-center text-[0.72rem] text-black/35">
          SmartMenus · multi-tenant platform · strict tenant isolation enforced on every query
        </p>
      </main>
    </div>
  );
}
