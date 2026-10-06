// AI grounding test harness — verifies the guardrails from the brief.
// Run: npx tsx scripts/test-ai.ts
import { buildAiContext, answerFromContext } from '../src/lib/ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CASES: { q: string; expect?: RegExp; lang: 'en' | 'fr'; tenant: string }[] = [
  // brief §16 example
  { tenant: 'cote-sauvage', lang: 'fr', q: "Je suis végétarien et je n'aime pas les plats épicés. Que recommandez-vous ?" },
  // brief §18 — popularity must be data-based, not a recommendation
  { tenant: 'harbour-co', lang: 'en', q: 'What is your most popular seafood dish?' },
  // brief §20 — medical guardrail
  { tenant: 'harbour-co', lang: 'en', q: 'Is this safe for someone with a severe nut allergy?', expect: /medical advice|guarantee/i },
  // brief §20 — never claim availability falsely
  { tenant: 'harbour-co', lang: 'en', q: 'Is the lobster available?', expect: /can't confirm|ask a member|indisponible/i },
  // allergens listing
  { tenant: 'harbour-co', lang: 'en', q: 'Which dishes contain dairy?' },
  // price grounding
  { tenant: 'harbour-co', lang: 'en', q: 'How much is the smash burger?', expect: /Rs 420/ },
  // FAQ
  { tenant: 'harbour-co', lang: 'en', q: 'Do you show live sport?', expect: /big screens/i },
  // hours
  { tenant: 'atelier-cascavelle', lang: 'fr', q: 'Quelles sont vos heures d’ouverture ?' },
  // sold-out awareness — Atelier has a sold-out Vanilla Custard Tart
  { tenant: 'atelier-cascavelle', lang: 'en', q: 'Is the vanilla custard tart available?', expect: /unavailable|can't confirm/i },
  // vegetarian filter
  { tenant: 'harbour-co', lang: 'en', q: 'What is vegetarian?' },
  // unknown → honest escalation
  { tenant: 'cote-sauvage', lang: 'en', q: 'Do you have a helicopter landing pad?', expect: /can't confirm|ask a member/i },
];

async function main() {
  let pass = 0, fail = 0;
  for (const c of CASES) {
    const r = await prisma.restaurant.findUnique({ where: { slug: c.tenant } });
    if (!r) { console.log(`SKIP ${c.tenant} not found`); continue; }
    const ctx = await buildAiContext(r.id, c.lang);
    if (!ctx) { console.log('no ctx'); continue; }
    const res = answerFromContext(ctx, c.q);
    const ok = c.expect ? c.expect.test(res.answer) : true;
    if (ok) pass++; else fail++;
    console.log(`\n${ok ? '✓' : '✗'} [${c.tenant}/${c.lang}] ${c.q}`);
    console.log(`   → ${res.answer.replace(/\n/g, '\n     ')}`);
    if (!ok && c.expect) console.log(`   ✗ expected ${c.expect}`);
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}
main();
