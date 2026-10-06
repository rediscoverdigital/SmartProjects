import type { Lang } from '@/lib/i18n';

export type GuestRestaurant = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  wifiName: string | null;
  wifiPassword: string | null;
  instagram: string | null;
  website: string | null;
  coverImage: string | null;
  logoText: string | null;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  textColor: string;
  themeMode: string;
  buttonStyle: string;
  welcomeMsg: string | null;
  currency: string;
  defaultLang: Lang;
  featAi: boolean;
  featSpecials: boolean;
  featCallStaff: boolean;
  featBill: boolean;
  featOrder: boolean;
  featFeedback: boolean;
  featAbout: boolean;
  openingHours: { dayOfWeek: number; open: string | null; close: string | null; closed: boolean }[];
  faqs: { question: string; questionFr: string | null; answer: string; answerFr: string | null }[];
};

export type GuestItem = {
  id: string;
  categoryId: string;
  name: string;
  nameFr: string | null;
  description: string | null;
  descriptionFr: string | null;
  price: number;
  image: string | null;
  ingredients: string | null;
  allergens: string | null;
  dietaryTags: string | null;
  spiceLevel: string;
  prepMinutes: number | null;
  calories: number | null;
  status: string;
  featured: boolean;
  recommended: boolean;
  isSpecial: boolean;
  aiNote: string | null;
};

export type GuestCategory = {
  id: string;
  name: string;
  nameFr: string | null;
  icon: string | null;
  displayOrder: number;
};

export type GuestData = {
  restaurant: GuestRestaurant;
  table: { id: string | null; label: string | null; location: string | null };
  sessionId: string;
  objectType: string;
  categories: GuestCategory[];
  items: GuestItem[];
};

export type CartLine = { itemId: string; qty: number };
