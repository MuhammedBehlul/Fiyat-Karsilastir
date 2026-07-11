import { getFeaturedProducts, getTopPriceDrops } from '@/lib/cached';
import PriceDropCard from './PriceDropCard';
import ProductCard from './ProductCard';

/**
 * Kategori sayfası üst bölümü: bu kategoride en çok düşen fiyatlar + çok
 * mağazada karşılaştırılabilenler. Veri yoksa hiç görünmez (boş bölüm yok).
 * getFeaturedProducts/getTopPriceDrops zaten lib/cached'de sarılı — Navbar'ın
 * mega menüsü de aynı (limit, categorySlug) argümanlarıyla çağırırsa tek
 * cache girdisini paylaşır, ayrı bir sarmalayıcıya gerek yok.
 */
export default async function CategoryWidgets({ categorySlug }: { categorySlug: string }) {
  const [drops, featured] = await Promise.all([
    getTopPriceDrops(4, categorySlug).catch(() => []),
    getFeaturedProducts(4, categorySlug).catch(() => []),
  ]);
  if (drops.length === 0 && featured.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      {drops.length > 0 && (
        <section>
          <h2 className="mb-4 font-heading text-heading font-bold text-text">
            Bu kategoride en çok düşenler
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {drops.map((d) => (
              <PriceDropCard key={d.id} drop={d} />
            ))}
          </div>
        </section>
      )}
      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 font-heading text-heading font-bold text-text">
            Çok mağazada karşılaştırılanlar
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
