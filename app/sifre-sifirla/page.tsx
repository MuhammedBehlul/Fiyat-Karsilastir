import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import ResetForm from '@/components/auth/ResetForm';

export const metadata = { title: 'Şifre sıfırla', robots: { index: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = '' } = await searchParams;

  if (!token) {
    return (
      <AuthShell title="Geçersiz bağlantı" subtitle="Sıfırlama bağlantısı eksik veya hatalı.">
        <Link href="/sifremi-unuttum" className="font-semibold text-primary hover:underline">
          Yeni bağlantı iste
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Yeni şifre belirle" subtitle="Hesabın için yeni bir şifre gir.">
      <ResetForm token={token} />
    </AuthShell>
  );
}
