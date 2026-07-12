// Kullanıcı / favori / fiyat alarmı veri erişimi — saf Prisma, Next.js importu yok
// (lib/queries.ts ile aynı ilke). Çerez/oturum katmanı lib/currentUser.ts'de.

import { prisma } from './db';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ---- Kullanıcı ----

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(email: string, passwordHash: string) {
  return prisma.user.create({ data: { email: normalizeEmail(email), passwordHash } });
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

// ---- Favoriler ----

export async function addFavorite(userId: number, variantId: number) {
  await prisma.favorite.upsert({
    where: { userId_variantId: { userId, variantId } },
    create: { userId, variantId },
    update: {},
  });
}

export async function removeFavorite(userId: number, variantId: number) {
  await prisma.favorite.deleteMany({ where: { userId, variantId } });
}

export async function isFavorite(userId: number, variantId: number): Promise<boolean> {
  const row = await prisma.favorite.findUnique({
    where: { userId_variantId: { userId, variantId } },
    select: { id: true },
  });
  return row !== null;
}

/** Kullanıcının favori varyant id'leri (liste sayfalarında kalp durumunu işaretlemek için). */
export async function getFavoriteVariantIds(userId: number): Promise<number[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { variantId: true },
  });
  return rows.map((r) => r.variantId);
}

// ---- Fiyat alarmları ----

export async function setPriceAlert(userId: number, variantId: number, targetPrice: number) {
  // Hedef değişince lastNotifiedAt sıfırlanır ki yeni hedefe göre tekrar tetiklenebilsin.
  await prisma.priceAlert.upsert({
    where: { userId_variantId: { userId, variantId } },
    create: { userId, variantId, targetPrice },
    update: { targetPrice, lastNotifiedAt: null },
  });
}

export async function removePriceAlert(userId: number, variantId: number) {
  await prisma.priceAlert.deleteMany({ where: { userId, variantId } });
}

export async function getAlertForVariant(userId: number, variantId: number) {
  const row = await prisma.priceAlert.findUnique({
    where: { userId_variantId: { userId, variantId } },
    select: { targetPrice: true },
  });
  return row ? { targetPrice: Number(row.targetPrice) } : null;
}

export async function getUserAlerts(userId: number) {
  const rows = await prisma.priceAlert.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { variantId: true, targetPrice: true, lastNotifiedAt: true },
  });
  return rows.map((r) => ({
    variantId: r.variantId,
    targetPrice: Number(r.targetPrice),
    lastNotifiedAt: r.lastNotifiedAt?.toISOString() ?? null,
  }));
}

// ---- Şifre sıfırlama jetonları ----

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 saat

export async function createResetToken(userId: number, tokenHash: string) {
  return prisma.authToken.create({
    data: {
      userId,
      tokenHash,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
}

/** Geçerliyse jetonu kullanılmış işaretler ve userId döner; değilse null. */
export async function consumeResetToken(tokenHash: string): Promise<number | null> {
  const token = await prisma.authToken.findFirst({
    where: { tokenHash, type: 'password_reset', usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!token) return null;
  await prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
  return token.userId;
}
