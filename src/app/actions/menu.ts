'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireTenant } from '@/lib/auth';
import { z } from 'zod';

async function audit(restaurantId: string, actorId: string, actorEmail: string, action: string, entityType: string, entityId: string, detail?: string) {
  await prisma.auditLog.create({ data: { restaurantId, actorId, actorEmail, action, entityType, entityId, detail } }).catch(() => {});
}

// ── ITEMS ──────────────────────────────────────────────────

const itemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  nameFr: z.string().max(120).optional().nullable(),
  categoryId: z.string().min(1),
  description: z.string().max(600).optional().nullable(),
  descriptionFr: z.string().max(600).optional().nullable(),
  price: z.coerce.number().min(0).max(1000000),
  image: z.string().max(500).optional().nullable(),
  ingredients: z.string().max(500).optional().nullable(),
  allergens: z.string().max(300).optional().nullable(),
  dietaryTags: z.string().max(300).optional().nullable(),
  spiceLevel: z.enum(['none', 'mild', 'medium', 'hot']).default('none'),
  prepMinutes: z.coerce.number().int().min(0).max(300).optional().nullable(),
  status: z.enum(['available', 'sold_out', 'hidden', 'coming_soon']).default('available'),
  featured: z.coerce.boolean().optional(),
  recommended: z.coerce.boolean().optional(),
  isSpecial: z.coerce.boolean().optional(),
  aiNote: z.string().max(400).optional().nullable(),
});

export async function saveItem(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };

  const raw = Object.fromEntries(formData.entries());
  const parsed = itemSchema.safeParse({
    ...raw,
    id: raw.id || undefined,
    featured: raw.featured === 'on' || raw.featured === 'true',
    recommended: raw.recommended === 'on' || raw.recommended === 'true',
    isSpecial: raw.isSpecial === 'on' || raw.isSpecial === 'true',
    prepMinutes: raw.prepMinutes || undefined,
  });
  if (!parsed.success) return { error: 'Please check the form fields.' };
  const d = parsed.data;

  // tenant isolation: the category must belong to this restaurant
  const cat = await prisma.category.findFirst({ where: { id: d.categoryId, restaurantId: user.restaurantId } });
  if (!cat) return { error: 'Invalid category.' };

  const data = {
    restaurantId: user.restaurantId,
    categoryId: d.categoryId,
    name: d.name,
    nameFr: d.nameFr || null,
    description: d.description || null,
    descriptionFr: d.descriptionFr || null,
    price: d.price,
    image: d.image || null,
    ingredients: d.ingredients || null,
    allergens: d.allergens || null,
    dietaryTags: d.dietaryTags || null,
    spiceLevel: d.spiceLevel,
    prepMinutes: d.prepMinutes ?? null,
    status: d.status,
    featured: !!d.featured,
    recommended: !!d.recommended,
    isSpecial: !!d.isSpecial,
    aiNote: d.aiNote || null,
  };

  if (d.id) {
    // scope the update to this tenant
    const existing = await prisma.menuItem.findFirst({ where: { id: d.id, restaurantId: user.restaurantId } });
    if (!existing) return { error: 'Not found.' };
    await prisma.menuItem.update({ where: { id: d.id }, data });
    await audit(user.restaurantId, user.id, user.email, 'item.updated', 'MenuItem', d.id, d.name);
  } else {
    const created = await prisma.menuItem.create({ data });
    await audit(user.restaurantId, user.id, user.email, 'item.created', 'MenuItem', created.id, d.name);
  }

  revalidatePath('/dashboard/menu');
  revalidatePath(`/t`);
  return { ok: true };
}

export async function toggleAvailability(itemId: string, status: string) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId: user.restaurantId } });
  if (!item) return { error: 'Not found' };
  const next = status === 'available' ? 'sold_out' : 'available';
  await prisma.menuItem.update({ where: { id: itemId }, data: { status: next } });
  await audit(user.restaurantId, user.id, user.email, 'item.availability', 'MenuItem', itemId, `${item.name}: ${status} → ${next}`);
  revalidatePath('/dashboard/menu');
  return { ok: true, status: next };
}

export async function deleteItem(itemId: string) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId: user.restaurantId } });
  if (!item) return { error: 'Not found' };
  await prisma.menuItem.delete({ where: { id: itemId } });
  await audit(user.restaurantId, user.id, user.email, 'item.deleted', 'MenuItem', itemId, item.name);
  revalidatePath('/dashboard/menu');
  return { ok: true };
}

export async function duplicateItem(itemId: string) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId: user.restaurantId } });
  if (!item) return { error: 'Not found' };
  const { id, createdAt, updatedAt, ...rest } = item;
  const created = await prisma.menuItem.create({ data: { ...rest, name: `${item.name} (copy)`, status: 'hidden' } });
  await audit(user.restaurantId, user.id, user.email, 'item.duplicated', 'MenuItem', created.id, item.name);
  revalidatePath('/dashboard/menu');
  return { ok: true };
}

// ── CATEGORIES ─────────────────────────────────────────────

export async function saveCategory(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const id = String(formData.get('id') || '');
  const name = String(formData.get('name') || '').trim();
  const nameFr = String(formData.get('nameFr') || '').trim() || null;
  const icon = String(formData.get('icon') || '').trim() || null;
  const displayOrder = Number(formData.get('displayOrder') || 0);
  const visible = formData.get('visible') === 'on';
  if (!name) return { error: 'Category name is required.' };

  if (id) {
    const existing = await prisma.category.findFirst({ where: { id, restaurantId: user.restaurantId } });
    if (!existing) return { error: 'Not found.' };
    await prisma.category.update({ where: { id }, data: { name, nameFr, icon, displayOrder, visible } });
    await audit(user.restaurantId, user.id, user.email, 'category.updated', 'Category', id, name);
  } else {
    const created = await prisma.category.create({ data: { restaurantId: user.restaurantId, name, nameFr, icon, displayOrder, visible } });
    await audit(user.restaurantId, user.id, user.email, 'category.created', 'Category', created.id, name);
  }
  revalidatePath('/dashboard/menu');
  return { ok: true };
}

export async function deleteCategory(categoryId: string) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const cat = await prisma.category.findFirst({ where: { id: categoryId, restaurantId: user.restaurantId }, include: { _count: { select: { items: true } } } });
  if (!cat) return { error: 'Not found' };
  if (cat._count.items > 0) return { error: `Move or delete the ${cat._count.items} items in this category first.` };
  await prisma.category.delete({ where: { id: categoryId } });
  await audit(user.restaurantId, user.id, user.email, 'category.deleted', 'Category', categoryId, cat.name);
  revalidatePath('/dashboard/menu');
  return { ok: true };
}
