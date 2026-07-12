'use client';

import { useActionState } from 'react';
import Input from '@/components/ui/Input';
import { register, type AuthState } from '@/app/hesap/actions';
import { Field, FormError } from './AuthShell';
import SubmitButton from './SubmitButton';

export default function RegisterForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(register, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="E-posta">
        <Input type="email" name="email" required autoComplete="email" autoFocus placeholder="ornek@eposta.com" />
      </Field>
      <Field label="Şifre">
        <Input type="password" name="password" required autoComplete="new-password" minLength={8} placeholder="En az 8 karakter" />
      </Field>
      <Field label="Şifre (tekrar)">
        <Input type="password" name="passwordConfirm" required autoComplete="new-password" minLength={8} placeholder="••••••••" />
      </Field>
      <FormError message={state.error} />
      <SubmitButton>Hesap oluştur</SubmitButton>
    </form>
  );
}
