import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
process.env.DATABASE_URL = 'file:./dev.db';
const p = new PrismaClient();
(async () => {
  const u = await p.user.findUnique({ where: { email: 'leo.a@example.org' }, select: { id: true, email: true, role: true } });
  if (!u) { console.log('No admin user found'); await p.$disconnect(); process.exit(1); }
  console.log('User:', JSON.stringify(u));

  const SECRET = 'smartmenus-dev-secret-change-in-production-8f42k';
  const payload = { uid: u.id, exp: Date.now() + 864e5 };
  const b = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(b).digest('base64url');
  const token = `${b}.${sig}`;

  const r = await fetch('http://localhost:3000/admin', {
    headers: { cookie: `sm_session=${token}` },
  });
  const t = await r.text();
  console.log('Admin page status:', r.status);
  console.log('Has CreateTenantForm:', t.includes('CreateTenantForm'));
  console.log('Has "Create new tenant":', t.includes('Create new tenant'));
  console.log('Has "New tenant":', t.includes('New tenant'));
  console.log('Has "Restaurant name":', t.includes('Restaurant name'));
  console.log('Has "Owner email":', t.includes('Owner email'));
  console.log('Has "New tenant" button text:', t.includes('New tenant'));

  await p.$disconnect();
})();
