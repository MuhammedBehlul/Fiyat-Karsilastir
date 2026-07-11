// Yönetici oturumu için imza tabanlı belirteç üretimi/doğrulaması.
// Next.js'e bağımlılığı yok; yalnızca Web Crypto (SubtleCrypto) kullanır —
// hem Edge middleware hem de Node ortamında aynı şekilde çalışır.

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
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

/** Girilen şifreyi beklenen şifreyle zamanlama saldırılarına dayanıklı şekilde karşılaştırır. */
export async function passwordsMatch(input: string, expected: string): Promise<boolean> {
  const key = await hmacKey('fk-admin-password-compare');
  const [a, b] = await Promise.all([
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input)),
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(expected)),
  ]);
  const bufA = new Uint8Array(a);
  const bufB = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

/** ADMIN_PASSWORD ile imzalanmış, süresi olan bir oturum belirteci üretir. */
export async function createSessionToken(secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const timestamp = Date.now().toString();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp));
  return `${timestamp}.${toBase64Url(signature)}`;
}

/** Belirtecin imzasını ve süresinin dolmadığını doğrular. */
export async function verifySessionToken(
  token: string | undefined | null,
  secret: string,
): Promise<boolean> {
  if (!token) return false;
  const [timestamp, signature] = token.split('.');
  if (!timestamp || !signature) return false;

  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_MS) return false;

  try {
    const key = await hmacKey(secret);
    return await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signature).buffer as ArrayBuffer,
      new TextEncoder().encode(timestamp),
    );
  } catch {
    return false;
  }
}
