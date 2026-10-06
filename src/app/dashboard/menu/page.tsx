import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MenuCMS } from '@/components/dash/MenuCMS';

export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;

  const [restaurant, categories, items] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id: user.restaurantId } }),
    prisma.category.findMany({ where: { restaurantId: user.restaurantId }, orderBy: { displayOrder: 'asc' } }),
    prisma.menuItem.findMany({ where: { restaurantId: user.restaurantId }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] }),
  ]);

  const tables = await prisma.tableObj.findMany({ where: { restaurantId: user.restaurantId }, include: { objects: true }, take: 1 });
  const guestCode = tables[0]?.objects[0]?.publicCode ?? null;

  return (
    <MenuCMS
      restaurantName={restaurant?.name ?? ''}
      currency={restaurant?.currency ?? 'MUR'}
      categories={categories.map((c) => ({ id: c.id, name: c.name, nameFr: c.nameFr, icon: c.icon, displayOrder: c.displayOrder, visible: c.visible }))}
      items={items.map((i) => ({
        id: i.id, categoryId: i.categoryId, name: i.name, nameFr: i.nameFr,
        description: i.description, descriptionFr: i.descriptionFr, price: i.price, image: i.image,
        ingredients: i.ingredients, allergens: i.allergens, dietaryTags: i.dietaryTags,
        spiceLevel: i.spiceLevel, prepMinutes: i.prepMinutes, status: i.status,
        featured: i.featured, recommended: i.recommended, isSpecial: i.isSpecial, aiNote: i.aiNote,
      }))}
      guestCode={guestCode}
    />
  );
}
