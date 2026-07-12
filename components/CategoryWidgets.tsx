import { getFeaturedProducts, getTopPriceDrops } from '@/lib/cached';
import Link from 'next/link';
import { formatPrice } from '@/lib/normalize';

/**
 * Kategori sayfası sağ sütun vitrini: en çok düşen fiyatlar + en çok karşılaştırılanlar.
 * Kompakt dikey kartlar halinde listelenir, yan sütuna mükemmel oturur.
 */
export default async function CategoryWidgets({ categorySlug }: { categorySlug: string }) {
  const [drops, featured] = await Promise.all([
    getTopPriceDrops(4, categorySlug).catch(() => []),
    getFeaturedProducts(4, categorySlug).catch(() => []),
  ]);
  if (drops.length === 0 && featured.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {drops.length > 0 && (
        <section className="bg-slate-50/45 border border-border/80 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl" aria-hidden="true">🔥</span>
            <h2 className="font-heading text-body font-bold text-text">
              En Çok Düşenler
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {drops.map((d) => (
              <Link
                key={d.id}
                href={`/urun/${d.id}`}
                className="group flex gap-3.5 bg-surface border border-border/50 rounded-2xl p-3 shadow-xs hover:border-primary/25 hover:shadow-sm transition-all duration-300"
              >
                <div className="h-14 w-14 shrink-0 flex items-center justify-center bg-slate-50/75 rounded-xl p-1.5 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- görseller harici CDN'den geliyor */}
                  <img
                    src={d.imageUrl ?? '/placeholder.svg'}
                    alt={d.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-between min-w-0 flex-1">
                  <p
                    title={d.name}
                    className="text-[13px] font-semibold text-text truncate group-hover:text-primary transition-colors leading-tight"
                  >
                    {d.name}
                  </p>
                  <div className="flex items-end justify-between gap-1.5 mt-1">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[11px] font-mono tabular-nums text-muted line-through">
                        {formatPrice(d.previousPrice)}
                      </span>
                      <span className="text-[13px] font-semibold font-mono tabular-nums text-success">
                        {formatPrice(d.currentPrice)}
                      </span>
                    </div>
                    <span className="inline-flex items-center justify-center bg-danger-soft text-danger text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0">
                      −%{d.percent.toFixed(0)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="bg-slate-50/45 border border-border/80 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl" aria-hidden="true">📊</span>
            <h2 className="font-heading text-body font-bold text-text">
              Çok Karşılaştırılanlar
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {featured.map((p) => {
              const cheapest = p.prices[0];
              return (
                <Link
                  key={p.id}
                  href={`/urun/${p.id}`}
                  className="group flex gap-3.5 bg-surface border border-border/50 rounded-2xl p-3 shadow-xs hover:border-primary/25 hover:shadow-sm transition-all duration-300"
                >
                  <div className="h-14 w-14 shrink-0 flex items-center justify-center bg-slate-50/75 rounded-xl p-1.5 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- görseller harici CDN'den geliyor */}
                    <img
                      src={p.imageUrl ?? '/placeholder.svg'}
                      alt={p.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between min-w-0 flex-1">
                    <p
                      title={p.name}
                      className="text-[13px] font-semibold text-text truncate group-hover:text-primary transition-colors leading-tight"
                    >
                      {p.name}
                    </p>
                    <div className="flex items-end justify-between gap-1.5 mt-1">
                      {cheapest ? (
                        <span className="text-[13px] font-semibold font-mono tabular-nums text-text">
                          {formatPrice(cheapest.price)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted">Fiyat yok</span>
                      )}
                      <span className="inline-flex items-center justify-center bg-primary-soft text-primary text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0">
                        {p.prices.length} mağaza
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
