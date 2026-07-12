'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import { login, type AuthState } from '@/app/hesap/actions';
import { Field, FormError } from './AuthShell';
import SubmitButton from './SubmitButton';

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(login, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="E-posta">
        <Input type="email" name="email" required autoComplete="email" autoFocus placeholder="ornek@eposta.com" />
      </Field>
      <Field label="Şifre">
        <Input type="password" name="password" required autoComplete="current-password" placeholder="••••••••" />
      </Field>
      <div className="-mt-1 text-right">
        <Link href="/sifremi-unuttum" className="text-caption font-medium text-primary hover:underline">
          Şifreni mi unuttun?
        </Link>
      </div>
      <FormError message={state.error} />
      <SubmitButton>Giriş yap</SubmitButton>
    </form>
  );
}
