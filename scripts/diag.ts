import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const SECRET = process.env.AUTH_SECRET || 'smartmenus-dev-secret-change-in-production-8f42k';
function sign(uid: string) {
  const b = Buffer.from(JSON.stringify({ uid, exp: Date.now() + 864e5 })).toString('base64url');
  return `${b}.${crypto.createHmac('sha256', SECRET).update(b).digest('base64url')}`;
}
(async () => {
  const u = await prisma.user.findUnique({ where: { email: 'grace.l@example.com' } });
  const c = `sm_session=${sign(u!.id)}`;
  const r = await fetch('http://localhost:3000/dashboard', { headers: { cookie: c } });
  const t = await r.text();
  // The RSC payload embeds the error; find messages / stack hints
  const msgs = t.match(/"message":"[^"]+"/g) || [];
  const errs = t.match(/Error[^"\\]{0,300}/g) || [];
  console.log('--- message fields ---');
  console.log([...new Set(msgs)].slice(0, 10).join('\n'));
  console.log('--- error strings ---');
  console.log([...new Set(errs)].slice(0, 10).join('\n'));
  console.log('--- invalid/prisma hints ---');
  const hints = t.match(/(Invalid|Unknown argument|Unknown field|PrismaClientValidation|does not exist)[^"\\]{0,220}/g) || [];
  console.log([...new Set(hints)].slice(0, 10).join('\n'));
  await prisma.$disconnect();
})();
