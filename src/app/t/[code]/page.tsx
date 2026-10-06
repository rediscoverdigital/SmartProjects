import { prisma } from '@/lib/db';
import { GuestApp } from '@/components/guest/GuestApp';
import { GuestError } from '@/components/guest/GuestError';
import type { GuestData } from '@/components/guest/types';

export const dynamic = 'force-dynamic';

export default async function TablePage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { s?: string };
}) {
  const code = params.code;
  const source = searchParams.s === 'nfc' ? 'nfc' : searchParams.s === 'qr' ? 'qr' : 'url';

  const object = await prisma.physicalObject.findUnique({
    where: { publicCode: code },
    include: { table: { include: { location: true } } },
  });

  if (!object) {
    return <GuestError kind="not_found" />;
  }
  if (object.status === 'suspended' || object.status === 'lost') {
    return <GuestError kind="unavailable" />;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: object.restaurantId },
    include: {
      categories: { where: { visible: true }, orderBy: { displayOrder: 'asc' } },
      items: { orderBy: { displayOrder: 'asc' } },
      faqs: { orderBy: { displayOrder: 'asc' } },
      openingHours: { orderBy: { dayOfWeek: 'asc' } },
      tables: { include: { objects: true }, take: 1 },
    },
  });

  if (!restaurant) return <GuestError kind="not_found" />;
  if (restaurant.status !== 'active') return <GuestError kind="suspended" />;

  // log the scan + open a session (server-side so it works even if JS is slow)
  const { startSession } = await import('@/lib/analytics');
  const session = await startSession({
    restaurantId: restaurant.id,
    tableId: object.tableId,
    objectId: object.id,
    source,
    language: restaurant.defaultLang === 'fr' ? 'fr' : 'en',
  });

  const data: GuestData = {
    restaurant: {
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
      tagline: restaurant.tagline,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      email: restaurant.email,
      wifiName: restaurant.wifiName,
      wifiPassword: restaurant.wifiPassword,
      instagram: restaurant.instagram,
      website: restaurant.website,
      coverImage: restaurant.coverImage,
      logoText: restaurant.logoText,
      primaryColor: restaurant.primaryColor,
      accentColor: restaurant.accentColor,
      surfaceColor: restaurant.surfaceColor,
      textColor: restaurant.textColor,
      themeMode: restaurant.themeMode,
      buttonStyle: restaurant.buttonStyle,
      welcomeMsg: restaurant.welcomeMsg,
      currency: restaurant.currency,
      defaultLang: restaurant.defaultLang === 'fr' ? 'fr' : 'en',
      featAi: restaurant.featAi,
      featSpecials: restaurant.featSpecials,
      featCallStaff: restaurant.featCallStaff,
      featBill: restaurant.featBill,
      featOrder: restaurant.featOrder,
      featFeedback: restaurant.featFeedback,
      featAbout: restaurant.featAbout,
      openingHours: restaurant.openingHours.map((h) => ({
        dayOfWeek: h.dayOfWeek, open: h.open, close: h.close, closed: h.closed,
      })),
      faqs: restaurant.faqs.map((f) => ({
        question: f.question, questionFr: f.questionFr, answer: f.answer, answerFr: f.answerFr,
      })),
    },
    table: {
      id: object.tableId,
      label: object.table?.label ?? null,
      location: object.table?.location?.name ?? null,
    },
    sessionId: session.id,
    objectType: object.objectType,
    categories: restaurant.categories.map((c) => ({
      id: c.id, name: c.name, nameFr: c.nameFr, icon: c.icon, displayOrder: c.displayOrder,
    })),
    items: restaurant.items.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      name: i.name,
      nameFr: i.nameFr,
      description: i.description,
      descriptionFr: i.descriptionFr,
      price: i.price,
      image: i.image,
      ingredients: i.ingredients,
      allergens: i.allergens,
      dietaryTags: i.dietaryTags,
      spiceLevel: i.spiceLevel,
      prepMinutes: i.prepMinutes,
      calories: i.calories,
      status: i.status,
      featured: i.featured,
      recommended: i.recommended,
      isSpecial: i.isSpecial,
      aiNote: i.aiNote,
    })),
  };

  return <GuestApp data={data} />;
}
