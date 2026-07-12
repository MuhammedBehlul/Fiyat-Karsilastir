import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Card from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/Button';
import { getFavoriteVariantIds } from '@/lib/accounts';
import { getCurrentUser } from '@/lib/currentUser';
import { getProductsByIds } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Favorilerim', robots: { index: false } };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/giris?next=/favorilerim');

  const ids = await getFavoriteVariantIds(user.id).catch(() => []);
  const products = await getProductsByIds(ids).catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Favorilerim' }]} />
      <header className="border-b border-border/60 pb-5">
        <h1 className="font-heading text-title font-extrabold text-text sm:text-display">Favorilerim</h1>
        <p className="mt-1.5 text-body-sm text-muted">
          Takip ettiğin ürünler — fiyatları düştüğünde haberdar olmak için fiyat alarmı kurabilirsin.
        </p>
      </header>

      {products.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-body text-muted">Henüz favori ürünün yok.</p>
          <p className="text-body-sm text-muted">
            Ürün kartlarındaki kalp simgesine dokunarak takip etmeye başla.
          </p>
          <Link href="/" className={buttonClasses('primary', 'md')}>
            Ürünleri keşfet
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} favorite />
          ))}
        </div>
      )}
    </div>
  );
}
