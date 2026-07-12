import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import ForgotForm from '@/components/auth/ForgotForm';

export const metadata = { title: 'Şifremi unuttum', robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Şifreni mi unuttun?"
      subtitle="E-posta adresini gir, sıfırlama bağlantısı gönderelim."
      footer={
        <Link href="/giris" className="font-semibold text-primary hover:underline">
          Girişe dön
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
