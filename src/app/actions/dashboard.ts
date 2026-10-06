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
