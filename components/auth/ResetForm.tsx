'use client';

import { useActionState } from 'react';
import Input from '@/components/ui/Input';
import { resetPassword, type AuthState } from '@/app/hesap/actions';
import { Field, FormError } from './AuthShell';
import SubmitButton from './SubmitButton';

export default function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(resetPassword, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <Field label="Yeni şifre">
        <Input type="password" name="password" required autoComplete="new-password" minLength={8} autoFocus placeholder="En az 8 karakter" />
      </Field>
      <Field label="Yeni şifre (tekrar)">
        <Input type="password" name="passwordConfirm" required autoComplete="new-password" minLength={8} placeholder="••••••••" />
      </Field>
      <FormError message={state.error} />
      <SubmitButton>Şifreyi güncelle</SubmitButton>
    </form>
  );
}
