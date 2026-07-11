import Link from 'next/link';
import Card from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/Input';
import { buttonClasses } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <p className="font-mono text-display font-bold text-primary">404</p>
      <h1 className="mt-2 font-heading text-title font-bold text-text">Sayfa bulunamadı</h1>
      <p className="mt-2 text-body-sm text-muted">
        Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir. Ürün mü arıyordunuz?
      </p>
      <div className="mx-auto mt-5 max-w-sm">
        <SearchInput placeholder="Ürün ara — örn. iPhone 15" aria-label="Ürün ara" />
      </div>
      <Link href="/" className={buttonClasses('ghost', 'md', 'mt-4')}>
        Ana sayfaya dön
      </Link>
    </Card>
  );
}
