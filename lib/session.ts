// Kullanıcı oturumu: AUTH_SECRET ile imzalanmış durumsuz (stateless) belirteç.
// lib/adminAuth.ts ile aynı desen — fark, payload'da kullanıcı id'si taşınması.
// Next.js importu yok (yalnızca Web Crypto); çerez okuma/yazma lib/currentUser.ts'de.

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün
export const SESSION_COOKIE = 'fk_session';
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000;

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/** userId + zaman damgasını AUTH_SECRET ile imzalar. */
export async function createSessionToken(userId: number, secret: string): Promise<string> {
  const payload = `${userId}.${Date.now()}`;
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

/** İmza + süre doğrular; geçerliyse userId döner, değilse null. */
export async function verifySessionToken(
  token: string | undefined | null,
  secret: string,
): Promise<number | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userIdStr, timestamp, signature] = parts;
  const payload = `${userIdStr}.${timestamp}`;

  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_MS) return null;

  try {
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signature).buffer as ArrayBuffer,
      new TextEncoder().encode(payload),
    );
    if (!ok) return null;
  } catch {
    return null;
  }
  const userId = Number(userIdStr);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

/** Tek kullanımlık jeton (şifre sıfırlama) üretir; ham jeton + DB'de saklanacak SHA-256 özeti. */
export async function createOpaqueToken(): Promise<{ raw: string; hash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = toBase64Url(bytes.buffer);
  return { raw, hash: await hashToken(raw) };
}

export async function hashToken(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return toBase64Url(digest);
}
