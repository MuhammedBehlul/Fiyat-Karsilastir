'use client';

import { useActionState } from 'react';
import Input from '@/components/ui/Input';
import { requestPasswordReset, type AuthState } from '@/app/hesap/actions';
import { Field, FormError, FormNotice } from './AuthShell';
import SubmitButton from './SubmitButton';

export default function ForgotForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="E-posta">
        <Input type="email" name="email" required autoComplete="email" autoFocus placeholder="ornek@eposta.com" />
      </Field>
      <FormError message={state.error} />
      <FormNotice message={state.notice} />
      <SubmitButton>Sıfırlama bağlantısı gönder</SubmitButton>
    </form>
  );
}
