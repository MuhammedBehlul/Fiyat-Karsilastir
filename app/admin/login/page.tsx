import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { login } from './actions';

export const metadata = { title: 'Yönetici girişi' };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = '/admin', error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="font-heading text-xl font-bold text-text sm:text-2xl">Yönetici girişi</h1>
        <p className="mt-1 text-sm text-muted">Bu alan yalnızca site yöneticisi içindir.</p>
      </div>
      <form
        action={login}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-premium"
      >
        <input type="hidden" name="next" value={next} />
        <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
          Şifre
          <Input type="password" name="password" required autoFocus autoComplete="current-password" />
        </label>
        {error && <p className="text-sm text-danger">Şifre hatalı, tekrar deneyin.</p>}
        <Button type="submit" className="w-full">
          Giriş yap
        </Button>
      </form>
    </div>
  );
}
