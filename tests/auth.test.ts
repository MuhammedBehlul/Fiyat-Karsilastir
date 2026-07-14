import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../lib/password';
import {
  createOpaqueToken,
  createSessionToken,
  hashToken,
  verifySessionToken,
} from '../lib/session';

describe('password (PBKDF2)', () => {
  it('doğru şifreyi kabul, yanlışı reddeder', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('aynı şifre her seferinde farklı hash üretir (salt)', async () => {
    const a = await hashPassword('x-password-1');
    const b = await hashPassword('x-password-1');
    expect(a).not.toBe(b);
  });

  it('bozuk saklanmış değer sessizce reddedilir', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('x', 'pbkdf2$abc$!!$??')).toBe(false);
  });
});

describe('session token (HMAC)', () => {
  const secret = 'test-secret';

  it('geçerli belirteç userId döner', async () => {
    const token = await createSessionToken(42, secret);
    expect(await verifySessionToken(token, secret)).toBe(42);
  });

  it('yanlış secret / kurcalanmış payload / çöp girdi reddedilir', async () => {
    const token = await createSessionToken(42, secret);
    expect(await verifySessionToken(token, 'other-secret')).toBeNull();
    expect(await verifySessionToken(token.replace(/^42/, '99'), secret)).toBeNull();
    expect(await verifySessionToken('a.b.c', secret)).toBeNull();
    expect(await verifySessionToken(undefined, secret)).toBeNull();
  });
});

describe('opaque token (şifre sıfırlama)', () => {
  it('ham jetonun özeti saklanan özetle eşleşir, ham != özet', async () => {
    const { raw, hash } = await createOpaqueToken();
    expect(await hashToken(raw)).toBe(hash);
    expect(raw).not.toBe(hash);
  });
});
