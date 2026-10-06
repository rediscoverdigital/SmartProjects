import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const r = await prisma.restaurant.findUnique({ where: { slug: 'cote-sauvage' } });
  const res = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ restaurantId: r!.id, question: 'Is the lobster available?', language: 'en' }),
  });
  const j: any = await res.json();
  console.log('Q: Is the lobster available?');
  console.log('A:', j.answer);
  console.log('unanswered:', j.unanswered, '| suggested:', JSON.stringify(j.suggestedItems));
  await prisma.$disconnect();
})();
