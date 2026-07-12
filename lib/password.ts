// Şifre hash'leme — Web Crypto PBKDF2-HMAC-SHA256. Bağımlılık yok; lib/adminAuth.ts
// ile aynı yaklaşım (yalnızca SubtleCrypto), hem Node hem Edge'de çalışır.
// Saklama biçimi: pbkdf2$<iterations>$<saltB64>$<hashB64>.

const ITERATIONS = 210_000; // OWASP 2023 önerisi (PBKDF2-HMAC-SHA256)
const KEY_BYTES = 32;
const SALT_BYTES = 16;

function toB64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromB64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

/** Girilen şifreyi saklanan hash ile sabit zamanlı olarak karşılaştırır. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterStr, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iterStr || !saltB64 || !hashB64) return false;
  const iterations = Number(iterStr);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  let expected: Uint8Array;
  let actual: Uint8Array;
  try {
    expected = fromB64(hashB64);
    actual = await derive(password, fromB64(saltB64), iterations);
  } catch {
    return false;
  }
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
