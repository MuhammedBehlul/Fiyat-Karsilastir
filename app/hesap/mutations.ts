'use server';

import {
  addFavorite,
  getAlertForVariant,
  isFavorite,
  removeFavorite,
  removePriceAlert,
  setPriceAlert,
} from '@/lib/accounts';
import { getCurrentUser } from '@/lib/currentUser';

export type ToggleResult = { active: boolean } | { needsAuth: true };

export async function toggleFavorite(variantId: number): Promise<ToggleResult> {
  const user = await getCurrentUser();
  if (!user) return { needsAuth: true };
  if (!Number.isInteger(variantId)) return { active: false };

  const currently = await isFavorite(user.id, variantId);
  if (currently) await removeFavorite(user.id, variantId);
  else await addFavorite(user.id, variantId);
  return { active: !currently };
}

export type AlertResult =
  | { targetPrice: number | null }
  | { needsAuth: true }
  | { error: string };

export async function saveAlert(variantId: number, targetPrice: number): Promise<AlertResult> {
  const user = await getCurrentUser();
  if (!user) return { needsAuth: true };
  if (!Number.isInteger(variantId)) return { error: 'Geçersiz ürün.' };
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) return { error: 'Geçerli bir hedef fiyat girin.' };

  await setPriceAlert(user.id, variantId, Math.round(targetPrice * 100) / 100);
  return { targetPrice };
}

export async function removeAlert(variantId: number): Promise<AlertResult> {
  const user = await getCurrentUser();
  if (!user) return { needsAuth: true };
  await removePriceAlert(user.id, variantId);
  return { targetPrice: null };
}

/** İstemci formunun mevcut alarmı okuması için (opsiyonel; sunucudan da geçilebilir). */
export async function getAlert(variantId: number): Promise<number | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const alert = await getAlertForVariant(user.id, variantId);
  return alert?.targetPrice ?? null;
}
