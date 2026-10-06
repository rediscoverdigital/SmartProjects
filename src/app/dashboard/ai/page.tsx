import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAiUsage, getTopAiQuestions } from '@/lib/analytics-queries';
import { AiConfig } from '@/components/dash/AiConfig';

export const dynamic = 'force-dynamic';

export default async function AiPage() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;
  const rid = user.restaurantId;

  const [restaurant, faqs, usage, questions, itemCount, catCount] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id: rid } }),
    prisma.faq.findMany({ where: { restaurantId: rid }, orderBy: { displayOrder: 'asc' } }),
    getAiUsage(rid),
    getTopAiQuestions(rid, '30d', 5),
    prisma.menuItem.count({ where: { restaurantId: rid } }),
    prisma.category.count({ where: { restaurantId: rid } }),
  ]);
  const hoursCount = await prisma.openingHour.count({ where: { restaurantId: rid } });

  return (
    <AiConfig
      featAi={restaurant?.featAi ?? true}
      welcomeMsg={restaurant?.welcomeMsg ?? ''}
      quota={restaurant?.aiMonthlyQuota ?? 2000}
      faqs={faqs.map((f) => ({ id: f.id, question: f.question, questionFr: f.questionFr, answer: f.answer, answerFr: f.answerFr }))}
      usage={usage}
      questions={questions}
      knowledge={{ items: itemCount, categories: catCount, faqs: faqs.length, hours: hoursCount, hasProfile: !!restaurant?.description }}
    />
  );
}
