// Next.js-aware oturum katmanı: çerezi okuyup/yazıp mevcut kullanıcıyı çözer.
// Saf token mantığı lib/session.ts'de, veri erişimi lib/accounts.ts'de.

import { cookies } from 'next/headers';
import { cache } from 'react';
import { getUserById } from './accounts';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifySessionToken,
} from './session';

export interface CurrentUser {
  id: number;
  email: string;
}

/**
 * Geçerli oturumun kullanıcısı (yoksa null). react cache() ile tek istekte
 * yalnızca bir kez çözülür — navbar + sayfa aynı isteği paylaşır.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token, secret);
  if (userId == null) return null;
  const user = await getUserById(userId).catch(() => null);
  return user ? { id: user.id, email: user.email } : null;
});

/** Oturum çerezini imzalayıp yazar (giriş/kayıt sonrası). */
export async function startSession(userId: number): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET tanımlı değil');
  const token = await createSessionToken(userId, secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
