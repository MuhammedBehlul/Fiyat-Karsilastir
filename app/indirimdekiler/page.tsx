import PriceDropSection from '@/components/PriceDropSection';

export const metadata = { title: 'İndirimdekiler' };

export default function DiscountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-bold text-text sm:text-2xl">İndirimdekiler</h1>
        <p className="mt-1 text-sm text-muted">
          Son taramaya göre fiyatı en çok düşen ürünler, düşüş oranına göre sıralı.
        </p>
      </div>
      <PriceDropSection showAllLink={false} />
    </div>
  );
}
