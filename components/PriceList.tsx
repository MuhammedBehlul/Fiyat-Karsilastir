import type { ProductWithPrices } from '@/lib/types';
import { formatDate, formatPrice } from '@/lib/normalize';
import { affiliateUrl, isAffiliateConfigured } from '@/lib/affiliate';
import SiteBadge from './SiteBadge';

// Bir ürünün site fiyatlarını karşılaştırır. Tek markup, grid ile responsive:
// mobilde site solda / fiyat+fark sağda iki blok, sm:'den itibaren gerçek tablo hizası.
export default function PriceList({ prices }: { prices: ProductWithPrices['prices'] }) {
  const cheapest = prices[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
      <div className="hidden bg-slate-50 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted sm:grid sm:grid-cols-[1.5fr_1.2fr_1fr_1fr_auto] sm:gap-6 border-b border-border">
        <span>Mağaza</span>
        <span className="text-right">Fiyat</span>
        <span className="text-right">Fiyat Farkı</span>
        <span className="text-right">Güncellenme</span>
        <span className="w-[120px]"></span>
      </div>
      <ul className="divide-y divide-border">
        {prices.map((p, i) => {
          const diff = p.price - cheapest.price;
          const isCheapest = i === 0;
          const diffLabel = isCheapest ? 'En Ucuz' : diff === 0 ? 'Eşit fiyat' : `+${formatPrice(diff)}`;
          const updated = formatDate(p.scrapedAt, { day: '2-digit', month: '2-digit' });
          return (
            <li key={p.siteName} className="group/item">
              <a
                href={affiliateUrl(p.productUrl, p.siteName)}
                target="_blank"
                rel={`noopener noreferrer nofollow${isAffiliateConfigured(p.siteName) ? ' sponsored' : ''}`}
                className={`flex min-h-16 items-center justify-between gap-3 px-5 py-3.5 transition-colors sm:grid sm:grid-cols-[1.5fr_1.2fr_1fr_1fr_auto] sm:gap-6 ${
                  isCheapest ? 'border-l-4 border-l-success bg-success-soft/50' : 'bg-white hover:bg-slate-50/50'
                }`}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <SiteBadge site={p.siteName} />
                  {isCheapest && (
                    <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-success/20 uppercase tracking-wider">
                      En Ucuz
                    </span>
                  )}
                </span>

                <span className="text-right">
                  <span
                    className={`block font-mono text-lg font-bold tracking-tight tabular-nums sm:text-base ${
                      isCheapest ? 'text-success' : 'text-text'
                    }`}
                  >
                    {formatPrice(p.price, p.currency)}
                  </span>
                  <span className="block text-xs tabular-nums text-muted sm:hidden mt-0.5">
                    {isCheapest ? `${updated} · Güncel` : `${diffLabel} · ${updated}`}
                  </span>
                </span>

                <span className={`hidden text-right text-sm font-semibold tabular-nums sm:block ${isCheapest ? 'text-success' : 'text-muted'}`}>
                  {diffLabel}
                </span>
                <span className="hidden text-right text-body-sm tabular-nums text-muted sm:block">{updated}</span>
                
                <span className="flex justify-end">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-primary text-white text-xs font-semibold px-4 py-2 hover:bg-primary-strong transition-all duration-200 group-hover/item:translate-x-0.5 shadow-sm shadow-primary/10">
                    Mağazaya Git
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
