'use server';

import { redirect } from 'next/navigation';
import {
  createResetToken,
  createUser,
  consumeResetToken,
  getUserByEmail,
  updateUserPassword,
} from '@/lib/accounts';
import { startSession, endSession } from '@/lib/currentUser';
import { sendEmail, emailLayout, emailButton } from '@/lib/email';
import { hashPassword, verifyPassword } from '@/lib/password';
import { siteUrl } from '@/lib/seo';
import { createOpaqueToken, hashToken } from '@/lib/session';

export interface AuthState {
  error?: string;
  notice?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200; // aşırı uzun girdiyle PBKDF2'yi yormayı engelle

/** Yalnızca site içi göreli yolları kabul et (açık yönlendirme açığını önler). */
function safeNext(value: FormDataEntryValue | null): string {
  const s = typeof value === 'string' ? value : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : '/';
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const passwordConfirm = String(formData.get('passwordConfirm') ?? '');
  const next = safeNext(formData.get('next'));

  if (!EMAIL_RE.test(email)) return { error: 'Geçerli bir e-posta adresi girin.' };
  if (password.length < MIN_PASSWORD) return { error: `Şifre en az ${MIN_PASSWORD} karakter olmalı.` };
  if (password.length > MAX_PASSWORD) return { error: 'Şifre çok uzun.' };
  if (password !== passwordConfirm) return { error: 'Şifreler eşleşmiyor.' };

  const existing = await getUserByEmail(email);
  if (existing) return { error: 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.' };

  const user = await createUser(email, await hashPassword(password));
  await startSession(user.id);
  redirect(next);
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));

  const user = await getUserByEmail(email);
  // Kullanıcı yoksa da hash doğrulaması yaparak zamanlama sızıntısını azalt; mesaj her durumda aynı.
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, 'pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
  if (!user || !ok) return { error: 'E-posta veya şifre hatalı.' };

  await startSession(user.id);
  redirect(next);
}

export async function logout(): Promise<void> {
  await endSession();
  redirect('/');
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '');
  const notice = 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.';
  if (!EMAIL_RE.test(email)) return { error: 'Geçerli bir e-posta adresi girin.' };

  const user = await getUserByEmail(email);
  // Kullanıcı yoksa sessizce başarı döneriz (e-postanın kayıtlı olup olmadığını sızdırma).
  if (user) {
    const { raw, hash } = await createOpaqueToken();
    await createResetToken(user.id, hash);
    const link = siteUrl(`/sifre-sifirla?token=${raw}`);
    await sendEmail({
      to: user.email,
      subject: 'Şifre sıfırlama bağlantınız',
      html: emailLayout(
        'Şifrenizi sıfırlayın',
        `<p style="font-size:14px;line-height:1.6;color:#334155;">Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın. Bağlantı 1 saat geçerlidir.</p>
         <p style="margin:22px 0;">${emailButton(link, 'Şifremi sıfırla')}</p>
         <p style="font-size:12px;color:#64748b;">Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`,
      ),
      text: `Şifrenizi sıfırlamak için bu bağlantıyı açın (1 saat geçerli): ${link}`,
    }).catch((err) => console.error('Şifre sıfırlama e-postası gönderilemedi:', err));
  }
  return { notice };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const passwordConfirm = String(formData.get('passwordConfirm') ?? '');

  if (password.length < MIN_PASSWORD) return { error: `Şifre en az ${MIN_PASSWORD} karakter olmalı.` };
  if (password.length > MAX_PASSWORD) return { error: 'Şifre çok uzun.' };
  if (password !== passwordConfirm) return { error: 'Şifreler eşleşmiyor.' };

  const userId = await consumeResetToken(await hashToken(token));
  if (userId == null) return { error: 'Bağlantı geçersiz veya süresi dolmuş. Yeniden isteyin.' };

  await updateUserPassword(userId, await hashPassword(password));
  await startSession(userId);
  redirect('/');
}
