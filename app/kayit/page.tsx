import Link from 'next/link';
import { redirect } from 'next/navigation';
import AuthShell from '@/components/auth/AuthShell';
import RegisterForm from '@/components/auth/RegisterForm';
import { getCurrentUser } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Kayıt ol', robots: { index: false } };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = '/' } = await searchParams;
  if (await getCurrentUser()) redirect(next.startsWith('/') ? next : '/');

  return (
    <AuthShell
      title="Hesap oluştur"
      subtitle="Ücretsiz — ürünleri favorile, fiyat düşünce haberdar ol."
      footer={
        <>
          Zaten hesabın var mı?{' '}
          <Link href={`/giris?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
            Giriş yap
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
