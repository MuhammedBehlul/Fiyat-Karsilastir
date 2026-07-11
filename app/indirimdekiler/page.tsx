import { getTopPriceDrops } from '@/lib/cached';
import DiscountsFilterView from '@/components/DiscountsFilterView';

export const metadata = { title: 'İndirimdekiler' };

export default async function DiscountsPage() {
  // Rich listeleme için en popüler 120 indirimi çekelim
  const drops = await getTopPriceDrops(120).catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-caption font-semibold uppercase tracking-wider text-muted font-heading">Fırsatlar</span>
        <h1 className="font-heading text-title font-extrabold text-text sm:text-display mt-0.5">
          İndirimdekiler
        </h1>
        <p className="mt-1 text-body-sm text-muted">
          Son taramaya göre fiyatı en çok düşen ürünler, indirim oranına göre sıralı.
        </p>
      </div>

      <DiscountsFilterView initialDrops={drops} />
    </div>
  );
}
