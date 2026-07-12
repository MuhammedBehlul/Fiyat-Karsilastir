import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import LoginForm from '@/components/auth/LoginForm';
import { getCurrentUser } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Giriş yap', robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = '/' } = await searchParams;
  if (await getCurrentUser()) redirect(next.startsWith('/') ? next : '/');

  return (
    <AuthShell
      title="Giriş yap"
      subtitle="Favorilerine ve fiyat alarmlarına eriş."
      footer={
        <>
          Hesabın yok mu?{' '}
          <Link href={`/kayit?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
            Kayıt ol
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
