// Smoke test: sign a real session cookie, then fetch dashboard pages
// and assert the rendered HTML contains expected tenant data.
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

// Use SQLite for local testing (matches dev server's .env.local)
process.env.DATABASE_URL = 'file:./dev.db';
const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';
const SECRET = process.env.AUTH_SECRET || 'smartmenus-dev-secret-change-in-production-8f42k';

function sign(uid: string): string {
  const body = Buffer.from(JSON.stringify({ uid, exp: Date.now() + 864e5 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean, extra = '') => {
  if (cond) { console.log(`  ✓ ${name}`); pass++; }
  else { console.log(`  ✗ ${name} ${extra}`); fail++; }
};

async function get(path: string, cookie?: string): Promise<{ status: number; text: string }> {
  const res = await fetch(BASE + path, { headers: cookie ? { cookie } : {}, redirect: 'manual' });
  const text = await res.text().catch(() => '');
  return { status: res.status, text };
}

async function main() {
  console.log('── Guest experience');
  const cases: [string, string][] = [['T8SAUV', 'Côte Sauvage'], ['T3HARB', 'Harbour'], ['T1ATEL', 'Atelier']];
  for (const [code, expect] of cases) {
    const r = await get(`/t/${code}`);
    check(`/t/${code} renders ${expect}`, r.status === 200 && r.text.includes(expect), `(${r.status})`);
  }
  const atelier = await get('/t/T1ATEL');
  check('sold-out item shows unavailable state', /sold|Épuisé|unavailable/i.test(atelier.text));
  check('EN/FR toggle present', atelier.text.includes('>en<') && atelier.text.includes('>fr<'));
  check('guest experience renders a menu category', /Brunch|Pastry|Coffee|Pâtisserie|Café/i.test(atelier.text));

  console.log('\n── Authentication & tenant isolation');
  const owner = await prisma.user.findUnique({ where: { email: 'grace.l@example.com' } });
  const staff = await prisma.user.findUnique({ where: { email: 'xena.w@example.org' } });
  const admin = await prisma.user.findUnique({ where: { email: 'leo.a@example.org' } });
  const harbourOwner = await prisma.user.findUnique({ where: { email: 'wendy.h@example.net' } });
  if (!owner || !staff || !admin || !harbourOwner) throw new Error('seed users missing');

  const ownerCookie = `sm_session=${sign(owner.id)}`;
  const staffCookie = `sm_session=${sign(staff.id)}`;
  const adminCookie = `sm_session=${sign(admin.id)}`;
  const harbourCookie = `sm_session=${sign(harbourOwner.id)}`;

  check('no cookie → /dashboard redirects', (await get('/dashboard')).status === 307);
  check('owner → /dashboard 200', (await get('/dashboard', ownerCookie)).status === 200);

  console.log('\n── Dashboard pages (Côte Sauvage owner)');
  const pages: [string, RegExp][] = [
    ['/dashboard', /Côte Sauvage/],
    ['/dashboard/floor', /Live floor/i],
    ['/dashboard/menu', /Menu/],
    ['/dashboard/tables', /Tables/],
    ['/dashboard/analytics', /Analytics/],
    ['/dashboard/ai', /AI assistant/i],
    ['/dashboard/feedback', /Feedback/],
    ['/dashboard/branding', /Branding/],
    ['/dashboard/staff', /Staff/],
  ];
  for (const [p, re] of pages) {
    const r = await get(p, ownerCookie);
    check(`${p} renders`, r.status === 200 && re.test(r.text), `(${r.status})`);
  }

  console.log('\n── Tenant isolation');
  const harbourDash = await get('/dashboard/menu', harbourCookie);
  check('Harbour owner does NOT see Côte Sauvage items', !harbourDash.text.includes('Octopus Carpaccio') && !harbourDash.text.includes("Carpaccio d'ourite"));
  check('Harbour owner DOES see Harbour items', harbourDash.text.includes('Smash') || harbourDash.text.includes('Chilli Wings') || harbourDash.text.includes('Ribs'));
  const sauvageDash = await get('/dashboard/menu', ownerCookie);
  check('Côte Sauvage owner does NOT see Harbour items', !sauvageDash.text.includes('Harbour Smash Burger'));
  check('staff → /admin redirects', (await get('/admin', staffCookie)).status === 307);
  check('super admin → /admin 200', (await get('/admin', adminCookie)).status === 200);
  const adminPage = await get('/admin', adminCookie);
  check('admin sees all tenants', adminPage.text.includes('Côte Sauvage') && adminPage.text.includes('Harbour') && adminPage.text.includes('Atelier'));
  check('restaurant owner → /admin redirects', (await get('/admin', ownerCookie)).status === 307);

  console.log('\n── Guest APIs');
  const resolve = await fetch(BASE + '/api/resolve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: 'T8SAUV', source: 'nfc', language: 'fr' }) });
  const rj: any = await resolve.json();
  check('resolve returns table + restaurant', resolve.status === 200 && rj.tableLabel === 'Table 8' && rj.restaurantSlug === 'cote-sauvage');
  const bad = await fetch(BASE + '/api/resolve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: 'ZZZZZ', source: 'qr' }) });
  check('unknown code → 404', bad.status === 404);

  const ai = await fetch(BASE + '/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ restaurantId: rj.restaurantId, sessionId: rj.sessionId, question: 'Is the lobster available?', language: 'en' }) });
  const aj: any = await ai.json();
  // Côte Sauvage DOES serve Lobster Thermidor, so a grounded "yes" is correct here.
  check('AI grounds availability from real data (lobster)', ai.status === 200 && /Lobster Thermidor is available/i.test(aj.answer || ''), `(${ai.status} ${aj.error || ''})`);

  // Harbour & Co. has no lobster → must refuse, not invent
  const harbour = await prisma.restaurant.findUnique({ where: { slug: 'harbour-co' } });
  const aiH = await fetch(BASE + '/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ restaurantId: harbour!.id, question: 'Is the lobster available?', language: 'en' }) });
  const ajH: any = await aiH.json();
  check('AI refuses to invent a dish the restaurant does not serve', /can't confirm|ask a member/i.test(ajH.answer || ''));

  const ai2 = await fetch(BASE + '/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ restaurantId: rj.restaurantId, question: 'Is this safe for a severe nut allergy?', language: 'en' }) });
  const aj2: any = await ai2.json();
  check('AI medical guardrail', /medical advice|guarantee/i.test(aj2.answer || ''));

  const fb = await fetch(BASE + '/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ restaurantId: rj.restaurantId, rating: 5, comment: 'Smoke test' }) });
  check('feedback POST works', fb.status === 200);
  const sr = await fetch(BASE + '/api/service-request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ restaurantId: rj.restaurantId, kind: 'call_staff' }) });
  check('service request POST works', sr.status === 200);
  const tr = await fetch(BASE + '/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ restaurantId: rj.restaurantId, sessionId: rj.sessionId, event: 'item_viewed' }) });
  check('track POST works', tr.status === 200);

  console.log(`\n════ ${pass} passed, ${fail} failed ════`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
