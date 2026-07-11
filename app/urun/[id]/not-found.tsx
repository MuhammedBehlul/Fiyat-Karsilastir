import Link from 'next/link';
import Card from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/Button';

export default function ProductNotFound() {
  return (
    <Card className="p-8 text-center">
      <h1 className="font-heading text-title font-bold text-text">Ürün bulunamadı</h1>
      <p className="mt-2 text-body-sm text-muted">
        Bu ürün artık takip edilmiyor ya da bağlantı hatalı. Aramayla ya da kategorilerden tekrar
        bulabilirsiniz.
      </p>
      <Link href="/" className={buttonClasses('primary', 'md', 'mt-5')}>
        Ana sayfaya dön
      </Link>
    </Card>
  );
}
