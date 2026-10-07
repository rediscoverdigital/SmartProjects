'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireTenant } from '@/lib/auth';
import { generatePublicCode } from '@/lib/utils';

// ── SERVICE REQUESTS ───────────────────────────────────────
export async function resolveRequest(id: string, status: 'acknowledged' | 'resolved' | 'cancelled') {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const req = await prisma.serviceRequest.findFirst({ where: { id, restaurantId: user.restaurantId } });
  if (!req) return { error: 'Not found' };
  await prisma.serviceRequest.update({
    where: { id },
    data: { status, resolvedAt: status === 'resolved' ? new Date() : null },
  });
  await prisma.auditLog.create({
    data: { restaurantId: user.restaurantId, actorId: user.id, actorEmail: user.email, action: `service.${status}`, entityType: 'ServiceRequest', entityId: id },
  }).catch(() => {});
  revalidatePath('/dashboard/floor');
  revalidatePath('/dashboard');
  return { ok: true };
}

// ── TABLES & PHYSICAL OBJECTS ──────────────────────────────
export async function createTable(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const label = String(formData.get('label') || '').trim();
  const locationId = String(formData.get('locationId') || '') || null;
  const seats = Number(formData.get('seats') || 0) || null;
  const objectType = String(formData.get('objectType') || 'table_number');
  if (!label) return { error: 'Table label is required.' };

  if (locationId) {
    const loc = await prisma.location.findFirst({ where: { id: locationId, restaurantId: user.restaurantId } });
    if (!loc) return { error: 'Invalid location.' };
  }

  const table = await prisma.tableObj.create({ data: { restaurantId: user.restaurantId, locationId, label, seats } });
  // auto-provision a unique opaque public code
  let code = generatePublicCode();
  while (await prisma.physicalObject.findUnique({ where: { publicCode: code } })) code = generatePublicCode();
  await prisma.physicalObject.create({
    data: { restaurantId: user.restaurantId, tableId: table.id, publicCode: code, objectType, label: `${label} · NFC + QR`, status: 'active' },
  });
  await prisma.auditLog.create({
    data: { restaurantId: user.restaurantId, actorId: user.id, actorEmail: user.email, action: 'table.created', entityType: 'TableObj', entityId: table.id, detail: label },
  }).catch(() => {});
  revalidatePath('/dashboard/tables');
  return { ok: true };
}

export async function createLocation(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const name = String(formData.get('name') || '').trim();
  const kind = String(formData.get('kind') || 'room');
  if (!name) return { error: 'Name required' };
  await prisma.location.create({ data: { restaurantId: user.restaurantId, name, kind } });
  revalidatePath('/dashboard/tables');
  return { ok: true };
}

export async function suspendObject(objectId: string) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const obj = await prisma.physicalObject.findFirst({ where: { id: objectId, restaurantId: user.restaurantId } });
  if (!obj) return { error: 'Not found' };
  const next = obj.status === 'active' ? 'suspended' : 'active';
  await prisma.physicalObject.update({ where: { id: objectId }, data: { status: next } });
  await prisma.auditLog.create({
    data: { restaurantId: user.restaurantId, actorId: user.id, actorEmail: user.email, action: `object.${next}`, entityType: 'PhysicalObject', entityId: objectId, detail: obj.publicCode },
  }).catch(() => {});
  revalidatePath('/dashboard/tables');
  return { ok: true, status: next };
}

/** Replace a physical tag without losing the table's historical analytics. */
export async function replaceObject(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const oldId = String(formData.get('oldId') || '');
  const newCode = String(formData.get('newCode') || '').trim().toUpperCase();
  const nfcUid = String(formData.get('nfcUid') || '').trim() || null;

  const old = await prisma.physicalObject.findFirst({ where: { id: oldId, restaurantId: user.restaurantId } });
  if (!old) return { error: 'Object not found.' };

  let code = newCode || generatePublicCode();
  if (newCode) {
    const clash = await prisma.physicalObject.findUnique({ where: { publicCode: newCode } });
    if (clash) return { error: 'That public code is already in use.' };
  }

  const created = await prisma.physicalObject.create({
    data: {
      restaurantId: user.restaurantId,
      tableId: old.tableId,
      publicCode: code,
      nfcUid,
      objectType: old.objectType,
      label: old.label,
      status: 'active',
    },
  });
  await prisma.physicalObject.update({ where: { id: old.id }, data: { status: 'replaced', replacedById: created.id } });
  await prisma.auditLog.create({
    data: { restaurantId: user.restaurantId, actorId: user.id, actorEmail: user.email, action: 'object.replaced', entityType: 'PhysicalObject', entityId: created.id, detail: `${old.publicCode} → ${code}` },
  }).catch(() => {});
  revalidatePath('/dashboard/tables');
  return { ok: true, newCode: code };
}

// ── BRANDING & SETTINGS ────────────────────────────────────
export async function saveBranding(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const g = (k: string) => String(formData.get(k) ?? '').trim();
  await prisma.restaurant.update({
    where: { id: user.restaurantId },
    data: {
      name: g('name') || undefined,
      tagline: g('tagline') || null,
      welcomeMsg: g('welcomeMsg') || null,
      primaryColor: g('primaryColor') || undefined,
      accentColor: g('accentColor') || undefined,
      surfaceColor: g('surfaceColor') || undefined,
      textColor: g('textColor') || undefined,
      themeMode: g('themeMode') || undefined,
      buttonStyle: g('buttonStyle') || undefined,
      coverImage: g('coverImage') || null,
      logo: g('logo') || null,
      logoText: g('logoText') || null,
      address: g('address') || null,
      phone: g('phone') || null,
      email: g('email') || null,
      wifiName: g('wifiName') || null,
      wifiPassword: g('wifiPassword') || null,
      instagram: g('instagram') || null,
      website: g('website') || null,
      currency: g('currency') || undefined,
      defaultLang: g('defaultLang') || undefined,
      featAi: formData.get('featAi') === 'on',
      featSpecials: formData.get('featSpecials') === 'on',
      featCallStaff: formData.get('featCallStaff') === 'on',
      featBill: formData.get('featBill') === 'on',
      featOrder: formData.get('featOrder') === 'on',
      featFeedback: formData.get('featFeedback') === 'on',
      featAbout: formData.get('featAbout') === 'on',
    },
  });
  await prisma.auditLog.create({
    data: { restaurantId: user.restaurantId, actorId: user.id, actorEmail: user.email, action: 'branding.updated', entityType: 'Restaurant', entityId: user.restaurantId },
  }).catch(() => {});
  revalidatePath('/dashboard/branding');
  return { ok: true };
}

// ── AI CONFIG ──────────────────────────────────────────────
export async function saveAiConfig(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const welcome = String(formData.get('welcomeMsg') || '').trim() || null;
  const quota = Number(formData.get('aiMonthlyQuota') || 2000);
  const featAi = formData.get('featAi') === 'on';
  await prisma.restaurant.update({ where: { id: user.restaurantId }, data: { welcomeMsg: welcome, aiMonthlyQuota: quota, featAi } });
  revalidatePath('/dashboard/ai');
  return { ok: true };
}

export async function saveFaq(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const id = String(formData.get('id') || '');
  const question = String(formData.get('question') || '').trim();
  const questionFr = String(formData.get('questionFr') || '').trim() || null;
  const answer = String(formData.get('answer') || '').trim();
  const answerFr = String(formData.get('answerFr') || '').trim() || null;
  if (!question || !answer) return { error: 'Question and answer are required.' };
  if (id) {
    const existing = await prisma.faq.findFirst({ where: { id, restaurantId: user.restaurantId } });
    if (!existing) return { error: 'Not found.' };
    await prisma.faq.update({ where: { id }, data: { question, questionFr, answer, answerFr } });
  } else {
    await prisma.faq.create({ data: { restaurantId: user.restaurantId, question, questionFr, answer, answerFr } });
  }
  revalidatePath('/dashboard/ai');
  return { ok: true };
}

export async function deleteFaq(id: string) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const f = await prisma.faq.findFirst({ where: { id, restaurantId: user.restaurantId } });
  if (!f) return { error: 'Not found' };
  await prisma.faq.delete({ where: { id } });
  revalidatePath('/dashboard/ai');
  return { ok: true };
}

// ── STAFF ──────────────────────────────────────────────────
export async function inviteStaff(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  if (user.role === 'staff') return { error: 'Only owners can manage staff.' };
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const name = String(formData.get('name') || '').trim();
  const role = String(formData.get('role') || 'staff');
  if (!email || !name) return { error: 'Name and email are required.' };
  if (!['owner', 'staff'].includes(role)) return { error: 'Invalid role.' };
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: 'That email is already registered.' };
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash('demo', 10); // pilot default; real flow would email a reset link
  await prisma.user.create({ data: { email, name, role, restaurantId: user.restaurantId, passwordHash: hash } });
  await prisma.auditLog.create({
    data: { restaurantId: user.restaurantId, actorId: user.id, actorEmail: user.email, action: 'staff.invited', entityType: 'User', detail: email },
  }).catch(() => {});
  revalidatePath('/dashboard/staff');
  return { ok: true };
}

export async function setStaffStatus(userId: string, status: string) {
  const user = await requireTenant();
  if (!user.restaurantId || user.role === 'staff') return { error: 'Not permitted' };
  const target = await prisma.user.findFirst({ where: { id: userId, restaurantId: user.restaurantId } });
  if (!target) return { error: 'Not found' };
  if (target.id === user.id) return { error: 'You cannot change your own access.' };
  await prisma.user.update({ where: { id: userId }, data: { status: status === 'active' ? 'suspended' : 'active' } });
  revalidatePath('/dashboard/staff');
  return { ok: true };
}

// ── PERMISSIONS ──────────────────────────────────────────────
const PERMISSION_KEYS = [
  'canViewMenu', 'canEditMenu', 'canEditPrice', 'canEditAvailability',
  'canManageTables', 'canConfigureAi', 'canViewAnalytics',
  'canResolveServiceRequests', 'canManageStaff', 'canManageBranding',
] as const;

export async function setStaffPermissions(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId || user.role === 'staff') return { error: 'Only owners can manage staff permissions.' };
  const targetId = String(formData.get('userId') || '');
  const target = await prisma.user.findFirst({ where: { id: targetId, restaurantId: user.restaurantId } });
  if (!target) return { error: 'User not found.' };
  if (target.role === 'owner') return { error: 'Cannot restrict owner permissions.' };
  const permissions: Record<string, boolean> = {};
  for (const key of PERMISSION_KEYS) {
    permissions[key] = formData.get(key) === 'on';
  }
  await prisma.user.update({ where: { id: targetId }, data: { permissions: JSON.stringify(permissions) } });
  await prisma.auditLog.create({
    data: { restaurantId: user.restaurantId, actorId: user.id, actorEmail: user.email, action: 'staff.permissions_updated', entityType: 'User', entityId: targetId, detail: JSON.stringify(permissions) },
  }).catch(() => {});
  revalidatePath('/dashboard/staff');
  return { ok: true, permissions };
}

// ── LOGO UPLOAD ──────────────────────────────────────────────
const LOGO_DIR = '/Users/benoit/smartmenus/public/uploads';
const LOGO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const LOGO_ALLOWED = ['image/png', 'image/x-png', 'image/webp'];

export async function uploadLogo(formData: FormData) {
  const user = await requireTenant();
  if (!user.restaurantId) return { error: 'No tenant' };
  const file = formData.get('logo') as File | null;
  if (!file) return { error: 'No file provided.' };
  if (!file.type || !LOGO_ALLOWED.includes(file.type)) return { error: 'Only PNG files are accepted.' };
  if (file.size > LOGO_MAX_BYTES) return { error: 'Logo must be smaller than 5 MB.' };

  // Validate PNG signature + dimensions
  const { validateLogoDimensionsSync } = await import('@/lib/image-utils');
  const arrayBuf = await file.arrayBuffer();
  const dims = validateLogoDimensionsSync(arrayBuf);
  if (dims.error) return { error: dims.error };

  const bytes = Buffer.from(arrayBuf);
  const crypto = await import('crypto');
  const ext = file.type === 'image/png' ? 'png' : 'webp';
  const filename = `logo_${crypto.randomBytes(8).toString('hex')}.${ext}`;

  // Ensure upload dir exists
  const fs = await import('fs/promises');
  await fs.mkdir(LOGO_DIR, { recursive: true }).catch(() => {});
  const dest = `${LOGO_DIR}/${filename}`;
  await fs.writeFile(dest, bytes);

  const publicPath = `/uploads/${filename}`;
  await prisma.restaurant.update({ where: { id: user.restaurantId }, data: { logo: publicPath } });
  await prisma.auditLog.create({
    data: { restaurantId: user.restaurantId, actorId: user.id, actorEmail: user.email, action: 'branding.logo_uploaded', entityType: 'Restaurant', entityId: user.restaurantId },
  }).catch(() => {});
  revalidatePath('/dashboard/branding');
  return { ok: true, logo: publicPath };
}

// ── TENANT CREATION (super_admin only) ───────────────────────
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

function formString(formData: FormData, key: string): string {
  return String(formData.get(key) || '').trim();
}

export async function createTenant(formData: FormData) {
  // Require super_admin — this is a platform-level action, not tenant-scoped
  const user = await requireTenant();
  if (user.role !== 'super_admin') return { error: 'Only platform admins can create tenants.' };

  const name = formString(formData, 'name');
  const slug = formString(formData, 'slug').toLowerCase();
  const ownerName = formString(formData, 'ownerName');
  const ownerEmail = formString(formData, 'ownerEmail').toLowerCase();
  const plan = formString(formData, 'plan') || 'growth';

  if (!name) return { error: 'Restaurant name is required.' };
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { error: 'Invalid slug — use lowercase letters, numbers, and hyphens only.' };
  if (!ownerName || !ownerEmail) return { error: 'Owner name and email are required.' };

  // Check slug uniqueness
  const existing = await prisma.restaurant.findUnique({ where: { slug } });
  if (existing) return { error: `A restaurant with slug /${slug} already exists.` };

  // Check owner email uniqueness
  const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (existingUser) return { error: `Email ${ownerEmail} is already registered.` };

  // Generate a random password for the owner (they'll reset it)
  const bcrypt = await import('bcryptjs');
  const tempPassword = crypto.randomBytes(6).toString('hex');

  const { generatePublicCode } = await import('@/lib/utils');

  // ── Hero image upload ─────────────────────────────────────
  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB — recommended 1920×1080
  let coverPath: string | null = null;

  const heroFile = formData.get('heroImage') as File | null;
  if (heroFile && heroFile.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(heroFile.type)) {
      return { error: 'Hero image must be PNG, JPEG, or WebP.' };
    }
    if (heroFile.size > MAX_IMAGE_BYTES) {
      return { error: `Hero image must be smaller than ${MAX_IMAGE_BYTES / 1024 / 1024} MB.` };
    }
    const arrayBuf = await heroFile.arrayBuffer();
    // For PNG, validate the signature via our utility
    if (heroFile.type.includes('png')) {
      const { validateLogoDimensionsSync } = await import('@/lib/image-utils');
      const dims = validateLogoDimensionsSync(arrayBuf);
      if (dims.error) return { error: dims.error };
    }
    const bytes = Buffer.from(arrayBuf);
    const ext = heroFile.type.split('/')[1];
    const filename = `cover_${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const fs = await import('fs/promises');
    await fs.mkdir(LOGO_DIR, { recursive: true }).catch(() => {});
    await fs.writeFile(`${LOGO_DIR}/${filename}`, bytes);
    coverPath = `/uploads/${filename}`;
  }

  // Create the restaurant + owner in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        slug,
        name,
        tagline: formString(formData, 'tagline') || undefined,
        address: formString(formData, 'address') || null,
        phone: formString(formData, 'phone') || null,
        email: formString(formData, 'email') || null,
        coverImage: coverPath || undefined,
        primaryColor: formString(formData, 'primaryColor') || undefined,
        accentColor: formString(formData, 'accentColor') || undefined,
        surfaceColor: formString(formData, 'surfaceColor') || undefined,
        textColor: formString(formData, 'textColor') || undefined,
        themeMode: formString(formData, 'themeMode') || undefined,
        plan,
      },
    });

    // Create the owner user
    const hash = await bcrypt.hash(tempPassword, 10);
    const owner = await tx.user.create({
      data: {
        email: ownerEmail,
        name: ownerName,
        role: 'owner',
        passwordHash: hash,
        restaurantId: restaurant.id,
      },
    });

    // Auto-provision one table with an NFC+QR object
    const table = await tx.tableObj.create({
      data: { restaurantId: restaurant.id, label: 'Table 1' },
    });
    let code = generatePublicCode();
    while (await tx.physicalObject.findUnique({ where: { publicCode: code } })) {
      code = generatePublicCode();
    }
    await tx.physicalObject.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        publicCode: code,
        objectType: 'table_number',
        label: 'Table 1 · NFC + QR',
      },
    });

    // Create a default subscription
    const monthlyPrice = plan === 'pro' ? 7500 : plan === 'growth' ? 3000 : 1500;
    await tx.subscription.create({
      data: {
        restaurantId: restaurant.id,
        plan,
        status: 'trial',
        monthlyPrice,
        renewsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: 'tenant.created',
        entityType: 'Restaurant',
        entityId: restaurant.id,
        detail: JSON.stringify({ name, slug, ownerEmail, plan, publicCode: code }),
      },
    }).catch(() => {});

    return { restaurant, owner, tableCode: code, tempPassword };
  });

  revalidatePath('/admin');
  return {
    ok: true,
    restaurantId: result.restaurant.id,
    slug: result.restaurant.slug,
    ownerEmail,
    tempPassword: result.tempPassword,
    tableCode: result.tableCode,
    guestUrl: `/t/${result.tableCode}`,
  };
}

// ── TENANT MANAGEMENT (super_admin only) ─────────────────────

export async function suspendTenant(formData: FormData): Promise<void> {
  const user = await requireTenant();
  if (user.role !== 'super_admin') return;

  const restaurantId = String(formData.get('restaurantId') || '');
  const suspend = String(formData.get('suspend') || '') === 'true';
  if (!restaurantId) return;

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) return;

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { status: suspend ? 'suspended' : 'active' },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorEmail: user.email,
      action: suspend ? 'tenant.suspended' : 'tenant.reactivated',
      entityType: 'Restaurant',
      entityId: restaurantId,
    },
  }).catch(() => {});

  revalidatePath('/admin');
}

export async function resetUserPassword(formData: FormData) {
  const user = await requireTenant();
  if (user.role !== 'super_admin') return { error: 'Only platform admins can reset passwords.' };

  const userId = String(formData.get('userId') || '');
  if (!userId) return { error: 'No user specified.' };

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return { error: 'User not found.' };

  if (targetUser.role === 'super_admin' && targetUser.id !== user.id) {
    return { error: 'Cannot reset another super admin password.' };
  }

  // Generate a strong random password (admin shares it with the user)
  const cryptoMod = await import('crypto');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = cryptoMod.randomBytes(12);
  let newPassword = '';
  for (let i = 0; i < 12; i++) newPassword += alphabet[bytes[i] % alphabet.length];

  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash, status: 'active' },
  });

  await prisma.auditLog.create({
    data: {
      restaurantId: targetUser.restaurantId ?? undefined,
      actorId: user.id,
      actorEmail: user.email,
      action: 'user.password_reset',
      entityType: 'User',
      entityId: userId,
      detail: JSON.stringify({ email: targetUser.email }),
    },
  }).catch(() => {});

  revalidatePath('/admin');
  return { ok: true, userId, email: targetUser.email, newPassword };
}

export async function updateUserStatus(userId: string, status: 'active' | 'suspended' | 'invited') {
  const user = await requireTenant();
  if (user.role !== 'super_admin') return { error: 'Only platform admins can manage users.' };

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) return { error: 'User not found.' };

  if (targetUser.role === 'super_admin' && targetUser.id !== user.id) {
    return { error: 'Cannot modify another super admin.' };
  }
  if (targetUser.id === user.id) {
    return { error: 'You cannot modify your own account.' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      restaurantId: targetUser.restaurantId ?? undefined,
      actorId: user.id,
      actorEmail: user.email,
      action: 'user.status_changed',
      entityType: 'User',
      entityId: userId,
      detail: JSON.stringify({ status }),
    },
  }).catch(() => {});

  revalidatePath('/admin');
  return { ok: true };
}
