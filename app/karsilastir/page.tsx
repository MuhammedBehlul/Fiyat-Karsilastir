import Link from 'next/link';
import CompareSync from '@/components/CompareSync';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Card from '@/components/ui/Card';
import SiteBadge from '@/components/SiteBadge';
import { buttonClasses } from '@/components/ui/Button';
import { getProductsByIds } from '@/lib/queries';
import { capacityLabel, colorLabel } from '@/lib/filters';
import { formatPrice } from '@/lib/normalize';
import { COMPARE_MAX } from '@/lib/compare';
import { SITES, type ProductWithPrices, type SiteName } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Ürün karşılaştırma',
  description: 'Seçtiğin ürünlerin fiyatlarını ve özelliklerini yan yana karşılaştır.',
  robots: { index: false },
};

function parseIds(raw: string | string[] | undefined): number[] {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return [];
  return [
    ...new Set(
      s.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0),
    ),
  ].slice(0, COMPARE_MAX);
}

/** Bir ürünün her sitedeki güncel fiyatı (yoksa null). */
function priceBySite(p: ProductWithPrices): Map<SiteName, number> {
  return new Map(p.prices.map((pr) => [pr.siteName, pr.price]));
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const { ids: rawIds } = await searchParams;
  const ids = parseIds(rawIds);
  const products = await getProductsByIds(ids).catch(() => []);
  const foundIds = products.map((p) => p.id);

  return (
    <div className="flex flex-col gap-6">
      <CompareSync ids={foundIds} />
      <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Karşılaştırma' }]} />
      <header className="border-b border-border/60 pb-5">
        <h1 className="font-heading text-title font-extrabold text-text sm:text-display">Karşılaştırma</h1>
        <p className="mt-1.5 text-body-sm text-muted">
          Ürün kartlarındaki karşılaştır simgesiyle en fazla {COMPARE_MAX} ürün seçip yan yana incele.
        </p>
      </header>

      {products.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-body text-muted">Karşılaştırılacak ürün seçilmedi.</p>
          <p className="text-body-sm text-muted">
            Ürün kartlarındaki <span className="font-medium text-text">karşılaştır</span> simgesine dokunarak başla.
          </p>
          <Link href="/" className={buttonClasses('primary', 'md')}>Ürünleri keşfet</Link>
        </Card>
      ) : (
        <CompareTable products={products} allIds={foundIds} />
      )}
    </div>
  );
}

function CompareTable({ products, allIds }: { products: ProductWithPrices[]; allIds: number[] }) {
  const cheapestByProduct = products.map((p) => p.prices[0]?.price ?? null);
  const overallMin = Math.min(...cheapestByProduct.filter((v): v is number => v != null));

  // Yalnızca en az bir üründe değeri olan özellik satırları gösterilir.
  const specRows: { label: string; value: (p: ProductWithPrices) => string | null }[] = [
    { label: 'Marka', value: (p: ProductWithPrices) => p.brand },
    { label: 'Depolama', value: (p: ProductWithPrices) => (p.storageGb != null ? capacityLabel(p.storageGb) : null) },
    { label: 'RAM', value: (p: ProductWithPrices) => (p.ramGb != null ? `${p.ramGb} GB` : null) },
    { label: 'Renk', value: (p: ProductWithPrices) => (p.color ? colorLabel(p.color) : null) },
  ].filter((row) => products.some((p) => row.value(p) != null));

  // Ürünlerden herhangi birinde fiyatı olan siteler (sabit SITES sırasında).
  const sitesPresent = SITES.filter((s) => products.some((p) => p.prices.some((pr) => pr.siteName === s)));
  const priceMaps = products.map(priceBySite);

  const colClass = 'min-w-[180px] w-[220px] p-4 align-top';
  const labelColClass = 'sticky left-0 z-10 bg-surface min-w-[130px] w-[130px] p-4 text-body-sm font-semibold text-muted';

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full border-collapse bg-surface text-left">
        <thead>
          <tr className="border-b border-border">
            <th className={`${labelColClass} border-b border-border`} />
            {products.map((p, i) => {
              const remaining = allIds.filter((id) => id !== p.id);
              const isCheapest = cheapestByProduct[i] != null && cheapestByProduct[i] === overallMin;
              return (
                <th key={p.id} className={`${colClass} border-l border-border`}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/urun/${p.id}`}
                        className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- harici CDN görselleri */}
                        <img src={p.imageUrl ?? '/placeholder.svg'} alt="" referrerPolicy="no-referrer" className="h-full w-full object-contain" />
                      </Link>
                      <Link
                        href={`/karsilastir?ids=${remaining.join(',')}`}
                        aria-label="Karşılaştırmadan çıkar"
                        title="Karşılaştırmadan çıkar"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-danger hover:text-danger"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </Link>
                    </div>
                    <Link href={`/urun/${p.id}`} className="line-clamp-2 text-body-sm font-semibold text-text hover:text-primary">
                      {p.name}
                    </Link>
                    {isCheapest && (
                      <span className="w-fit rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                        En uygun
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {/* En düşük fiyat satırı */}
          <tr className="border-b border-border">
            <td className={labelColClass}>En düşük fiyat</td>
            {products.map((p, i) => {
              const price = cheapestByProduct[i];
              const isMin = price != null && price === overallMin;
              return (
                <td key={p.id} className={`${colClass} border-l border-border`}>
                  {price != null ? (
                    <span className={`font-mono text-lg font-extrabold tabular-nums ${isMin ? 'text-success' : 'text-text'}`}>
                      {formatPrice(price)}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Özellik satırları */}
          {specRows.map((row) => (
            <tr key={row.label} className="border-b border-border">
              <td className={labelColClass}>{row.label}</td>
              {products.map((p) => (
                <td key={p.id} className={`${colClass} border-l border-border text-body-sm text-text`}>
                  {row.value(p) ?? <span className="text-muted">—</span>}
                </td>
              ))}
            </tr>
          ))}

          {/* Mağaza bazında fiyat satırları */}
          {sitesPresent.length > 0 && (
            <tr className="bg-surface-alt/60">
              <td className={`${labelColClass} bg-surface-alt/60 text-caption uppercase tracking-wider`}>Mağaza fiyatları</td>
              {products.map((p) => (
                <td key={p.id} className={`${colClass} border-l border-border`} />
              ))}
            </tr>
          )}
          {sitesPresent.map((site) => {
            // Bu site satırında ürünler arasındaki en düşük fiyatı vurgula.
            const rowPrices = priceMaps.map((m) => m.get(site) ?? null);
            const rowMin = Math.min(...rowPrices.filter((v): v is number => v != null));
            return (
              <tr key={site} className="border-b border-border last:border-b-0">
                <td className={labelColClass}>
                  <SiteBadge site={site} />
                </td>
                {products.map((p, i) => {
                  const price = rowPrices[i];
                  const isMin = price != null && price === rowMin && rowPrices.filter((v) => v != null).length > 1;
                  return (
                    <td key={p.id} className={`${colClass} border-l border-border`}>
                      {price != null ? (
                        <span className={`font-mono text-body-sm font-semibold tabular-nums ${isMin ? 'text-success' : 'text-text'}`}>
                          {formatPrice(price)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
