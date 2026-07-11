import Link from 'next/link';
import PriceDropCard from './PriceDropCard';
import Card from './ui/Card';
import { getTopPriceDrops } from '@/lib/cached';

export default async function PriceDropSection({ showAllLink = true }: { showAllLink?: boolean }) {
  const drops = await getTopPriceDrops(showAllLink ? 8 : 60).catch(() => []);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-heading font-semibold text-text">Fiyatı düşenler</h2>
        {showAllLink && drops.length > 0 && (
          <Link href="/indirimdekiler" className="text-body-sm font-medium text-primary hover:underline">
            Tümünü gör
          </Link>
        )}
      </div>
      {drops.length === 0 ? (
        <Card className="p-6 text-body-sm text-muted">
          Henüz düşüş verisi yok — scraper birkaç gün çalıştıktan sonra fiyatı düşen ürünler burada
          listelenecek.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {drops.map((d) => (
            <PriceDropCard key={d.id} drop={d} />
          ))}
        </div>
      )}
    </section>
  );
}
