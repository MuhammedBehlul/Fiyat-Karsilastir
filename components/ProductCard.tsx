import Link from 'next/link';
import type { ProductWithPrices, SiteName } from '@/lib/types';
import { SITE_LABELS } from '@/lib/types';
import { capacityLabel, colorLabel } from '@/lib/filters';
import Badge from './ui/Badge';
import Card from './ui/Card';
import PriceTag from './ui/PriceTag';
import { TrendDownIcon, TrendUpIcon } from './ui/icons';
import { SITE_COLOR_VAR } from './SiteBadge';
import { cx } from './ui/cx';

const COMPACT_SITE_LABELS: Record<SiteName, string> = {
  trendyol: 'Trendyol',
  hepsiburada: 'Hepsiburada',
  amazon: 'Amazon',
  vatan: 'Vatan',
  n11: 'N11',
};

/** Kart altı teknik özet: "Apple · 128 GB · 8 GB RAM · Mavi" (boş alanlar atlanır). */
function specLine(product: ProductWithPrices): string {
  return [
    product.brand,
    product.storageGb != null ? capacityLabel(product.storageGb) : null,
    product.ramGb != null ? `${product.ramGb} GB RAM` : null,
    product.color ? colorLabel(product.color) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

// Trend göstergesi: yeşil yalnızca düşüş için (semantik), yükseliş kırmızı, sabit gri.
function TrendIndicator({ trend }: { trend: ProductWithPrices['trend'] }) {
  if (!trend) return null;
  if (trend.direction === 'flat') {
    return <span className="text-caption font-medium text-muted">→ Sabit</span>;
  }
  const up = trend.direction === 'up';
  const pct = trend.percent.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  const Icon = up ? TrendUpIcon : TrendDownIcon;
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-caption font-semibold tabular-nums ${
        up ? 'text-danger' : 'text-success'
      }`}
      title={up ? 'Dünden bu yana en ucuz fiyat yükseldi' : 'Dünden bu yana en ucuz fiyat düştü'}
    >
      <Icon className="h-3 w-3" />%{pct}
    </span>
  );
}

// prices ucuzdan pahalıya sıralı gelir (lib/queries garanti eder).
export default function ProductCard({ product }: { product: ProductWithPrices }) {
  const cheapest = product.prices[0];
  const siteCount = product.prices.length;
  const specs = specLine(product);
  return (
    <Card interactive className="group flex flex-col p-2.5">
      <Link href={`/urun/${product.id}`} className="flex flex-1 flex-col">
        <div className="flex h-44 items-center justify-center p-6 pb-4 bg-slate-50/50 rounded-2xl overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- görseller 5 farklı harici CDN'den geliyor */}
          <img
            src={product.imageUrl ?? '/placeholder.svg'}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3.5 p-4 pt-4 sm:p-4.5 sm:pt-4">
          <div>
            <p
              title={product.name}
              className="line-clamp-2 text-body-sm font-semibold text-text leading-snug group-hover:text-primary transition-colors duration-200"
            >
              {product.name}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-caption text-muted/80">
              {specs && <span className="font-medium text-muted">{specs}</span>}
              <span>{siteCount > 1 ? `${siteCount} mağazada karşılaştırıldı` : 'Tek mağazada bulundu'}</span>
            </p>
          </div>

          {/* Fiyat merdiveni: her mağaza + fiyatı, ucuzdan pahalıya kompakt satırlar. */}
          <ul className="space-y-1">
            {product.prices.map((p, i) => (
              <li
                key={p.siteName}
                className={cx(
                  "flex items-center justify-between gap-2 border-t border-border/60 py-2 first:border-t-0",
                  i === 0 && "bg-success-soft/60 border border-success/15 rounded-xl px-2 py-1 -mx-1 my-0.5 shadow-sm"
                )}
              >
                <span className="flex items-center gap-2 text-caption text-muted">
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full shadow-sm"
                    style={{
                      backgroundColor: SITE_COLOR_VAR[p.siteName],
                      boxShadow: `0 0 6px ${SITE_COLOR_VAR[p.siteName]}80`
                    }}
                  />
                  <span className={cx("transition-colors", i === 0 ? "font-semibold text-text" : "font-medium group-hover:text-text")}>
                    {COMPACT_SITE_LABELS[p.siteName]}
                  </span>
                </span>
                <PriceTag price={Math.round(p.price)} currency={p.currency} size="sm" tone={i === 0 ? 'cheapest' : 'default'} />
              </li>
            ))}
          </ul>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/80 pt-3">
            {cheapest && <Badge variant="cheapest">En ucuz · {SITE_LABELS[cheapest.siteName]}</Badge>}
            <TrendIndicator trend={product.trend} />
          </div>
        </div>
      </Link>
    </Card>
  );
}
