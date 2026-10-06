import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { BrandingForm } from '@/components/dash/BrandingForm';

export const dynamic = 'force-dynamic';

export default async function BrandingPage() {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return null;
  const [r, tables] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id: user.restaurantId } }),
    prisma.tableObj.findMany({ where: { restaurantId: user.restaurantId }, include: { objects: true }, take: 1 }),
  ]);
  if (!r) return null;

  return (
    <BrandingForm
      guestCode={tables[0]?.objects[0]?.publicCode ?? null}
      data={{
        name: r.name, tagline: r.tagline, welcomeMsg: r.welcomeMsg, logoText: r.logoText, logo: r.logo,
        primaryColor: r.primaryColor, accentColor: r.accentColor, surfaceColor: r.surfaceColor, textColor: r.textColor,
        themeMode: r.themeMode, buttonStyle: r.buttonStyle, coverImage: r.coverImage,
        address: r.address, phone: r.phone, email: r.email, wifiName: r.wifiName, wifiPassword: r.wifiPassword,
        instagram: r.instagram, website: r.website, currency: r.currency, defaultLang: r.defaultLang,
        featAi: r.featAi, featSpecials: r.featSpecials, featCallStaff: r.featCallStaff, featBill: r.featBill,
        featOrder: r.featOrder, featFeedback: r.featFeedback, featAbout: r.featAbout,
      }}
    />
  );
}
