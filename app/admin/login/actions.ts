'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSessionToken, passwordsMatch } from '@/lib/adminAuth';

export async function login(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const nextParam = String(formData.get('next') ?? '/admin');
  const next = nextParam.startsWith('/admin') ? nextParam : '/admin';
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || !(await passwordsMatch(password, expected))) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const token = await createSessionToken(expected);
  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(next);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/admin/login');
}
