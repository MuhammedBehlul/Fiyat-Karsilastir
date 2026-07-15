import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AlertForm from '@/components/AlertForm';
import CompareToggle from '@/components/CompareToggle';
import FavoriteButton from '@/components/FavoriteButton';
import JsonLd from '@/components/JsonLd';
import PriceList from '@/components/PriceList';
import PriceHistoryChart from '@/components/PriceHistoryChart';
import ProductCard from '@/components/ProductCard';
import ProductImage from '@/components/ProductImage';
import ShareButtons from '@/components/ShareButtons';
import SiteBadge from '@/components/SiteBadge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { getPriceHistory, getProductWithPrices } from '@/lib/cached';
import { getAlertForVariant, getFavoriteVariantIds } from '@/lib/accounts';
import { getCurrentUser } from '@/lib/currentUser';
import { getSimilarProducts } from '@/lib/queries';
import { buildChartRows, findLowestEver } from '@/lib/history';
import { calcSavings, formatDate, formatPrice } from '@/lib/normalize';
import { buildBreadcrumbJsonLd, buildProductJsonLd, siteUrl } from '@/lib/seo';
import { CATEGORIES, SITE_LABELS, type CategorySlug } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // getProductWithPrices lib/cached'den gelir — sayfa gövdesindeki ikinci
  // çağrı cache isabetidir, DB'ye ikinci kez gidilmez.
  const product = await getProductWithPrices(Number(id)).catch(() => null);
  if (!product) return {};
  const cheapest = product.prices[0];
  const description = cheapest
    ? `${product.name} en ucuz ${formatPrice(cheapest.price, cheapest.currency)} fiyatla ${SITE_LABELS[cheapest.siteName]}'de. ${product.prices.length} mağazanın fiyatını karşılaştırın.`
    : `${product.name} fiyatlarını karşılaştırın.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/urun/${id}` },
    openGraph: {
      title: product.name,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const [product, history] = await Promise.all([
    getProductWithPrices(productId).catch(() => null),
    getPriceHistory(productId).catch(() => []),
  ]);
  if (!product) notFound();
  const chartRows = buildChartRows(history);
  const lowestEver = findLowestEver(history);
  const cheapest = product.prices[0];
  const priciest = product.prices[product.prices.length - 1];
  const savings = cheapest && priciest ? calcSavings(cheapest.price, priciest.price) : null;

  // Benzer ürünler + kullanıcıya özel durum (force-dynamic sayfa): favori + alarm.
  const user = await getCurrentUser().catch(() => null);
  const [similar, favIds, existingAlert] = await Promise.all([
    getSimilarProducts(productId, 8).catch(() => []),
    user ? getFavoriteVariantIds(user.id).catch(() => []) : Promise.resolve([]),
    user ? getAlertForVariant(user.id, productId).catch(() => null) : Promise.resolve(null),
  ]);
  const favSet = new Set(favIds);
  const favorited = favSet.has(productId);

  // Gezinti izi: kategori adı DB'siz, statik CATEGORIES sabitinden çözülür.
  const categoryLabel =
    product.categorySlug && product.categorySlug in CATEGORIES
      ? CATEGORIES[product.categorySlug as CategorySlug]
      : null;
  const breadcrumbItems = [
    { label: 'Ana Sayfa', href: '/' },
    ...(categoryLabel ? [{ label: categoryLabel, href: `/kategori/${product.categorySlug}` }] : []),
    { label: product.name },
  ];
  const productJsonLd = buildProductJsonLd(product);

  return (
    <div className="flex flex-col gap-8">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      {productJsonLd && <JsonLd data={productJsonLd} />}
      <Breadcrumb items={breadcrumbItems} />
      <section className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-8 rounded-3xl border border-border bg-surface p-6 shadow-premium">
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 h-56 md:h-full min-h-56 relative overflow-hidden group">
          <div className="absolute left-3 top-3 z-10">
            <CompareToggle variantId={product.id} />
          </div>
          <div className="absolute right-3 top-3 z-10">
            <FavoriteButton variantId={product.id} initialActive={favorited} />
          </div>
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            sizes="(max-width: 768px) 100vw, 240px"
            priority
            className="transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center gap-3.5">
          <h1 className="font-heading text-2xl font-bold text-text sm:text-3xl leading-snug">
            {product.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3.5 border-y border-border/80 py-4 my-1">
            {cheapest && (
              <div className="flex items-baseline gap-2.5">
                <span className="text-body-sm font-medium text-muted">En Uygun Fiyat:</span>
                <span className="font-mono text-3xl font-extrabold tracking-tight tabular-nums text-success sm:text-4xl">
                  {formatPrice(cheapest.price, cheapest.currency)}
                </span>
              </div>
            )}
            {cheapest && (
              <div className="flex items-center gap-2 bg-slate-50 border border-border rounded-xl px-3 py-1.5 shadow-sm">
                <span className="text-xs text-muted">Mağaza:</span>
                <SiteBadge site={cheapest.siteName} />
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2.5 items-center mt-1">
            {savings && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft border border-success/15 px-3 py-1 text-xs font-semibold text-success shadow-sm">
                🎉 En pahalıya göre {formatPrice(savings.amount)} (%{savings.percent.toFixed(0)}) tasarruf
              </span>
            )}
            {lowestEver && cheapest && lowestEver.price < cheapest.price && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/55 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                🏷️ Tüm zamanların en düşüğü: {formatPrice(lowestEver.price)} ({formatDate(lowestEver.date)})
              </span>
            )}
          </div>

          <div className="mt-1 border-t border-border/60 pt-3.5">
            <ShareButtons url={siteUrl(`/urun/${product.id}`)} title={product.name} />
          </div>
        </div>
      </section>

      <AlertForm
        variantId={product.id}
        currentPrice={cheapest?.price ?? null}
        initialTarget={existingAlert?.targetPrice ?? null}
        loggedIn={user != null}
      />

      <section>
        <h2 className="mb-4 font-heading text-lg font-bold text-text">Tüm Mağaza Fiyatları</h2>
        <PriceList prices={product.prices} />
      </section>

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-premium">
        <h2 className="mb-5 font-heading text-lg font-bold text-text">Fiyat Analizi ve Geçmişi</h2>
        
        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-success-soft/50 to-transparent p-5 flex flex-col gap-1 shadow-sm hover:border-success/35 hover:scale-[1.01] hover:shadow-md transition-all duration-200">
            <span className="text-caption font-semibold uppercase tracking-wider text-muted">Tüm Zamanların En Düşüğü</span>
            <span className="font-mono text-xl font-extrabold text-success mt-1">
              {lowestEver ? formatPrice(lowestEver.price) : '—'}
            </span>
            <span className="text-[10px] text-muted">
              {lowestEver ? formatDate(lowestEver.date) : 'Kayıt bulunmuyor'}
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-to-br from-danger-soft/50 to-transparent p-5 flex flex-col gap-1 shadow-sm hover:border-danger/35 hover:scale-[1.01] hover:shadow-md transition-all duration-200">
            <span className="text-caption font-semibold uppercase tracking-wider text-muted">Güncel En Yüksek</span>
            <span className="font-mono text-xl font-extrabold text-danger mt-1">
              {priciest ? formatPrice(priciest.price) : '—'}
            </span>
            <span className="text-[10px] text-muted">
              En pahalı satıcı fiyatı
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary-soft/50 to-transparent p-5 flex flex-col gap-1 shadow-sm hover:border-primary/35 hover:scale-[1.01] hover:shadow-md transition-all duration-200">
            <span className="text-caption font-semibold uppercase tracking-wider text-muted">Fiyat Trendi</span>
            <span className="mt-1 flex items-center gap-1.5 font-heading text-base font-bold text-text">
              {product.trend ? (
                product.trend.direction === 'down' ? (
                  <span className="text-success flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                      <path d="m3 7 6.5 6.5 4-4L21 17M21 11v6h-6" />
                    </svg>
                    Düşüşte (%{product.trend.percent.toFixed(1)})
                  </span>
                ) : product.trend.direction === 'up' ? (
                  <span className="text-danger flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                      <path d="m3 17 6.5-6.5 4 4L21 7M21 13V7h-6" />
                    </svg>
                    Yükselişte (%{product.trend.percent.toFixed(1)})
                  </span>
                ) : (
                  <span className="text-muted">Stabil / Değişimsiz</span>
                )
              ) : (
                <span className="text-muted">Veri yetersiz</span>
              )}
            </span>
            <span className="text-[10px] text-muted">
              Son iki tarama verisi
            </span>
          </div>
        </div>

        <div className="pt-2">
          <PriceHistoryChart rows={chartRows} />
        </div>
      </section>

      {similar.length > 0 && (
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-text">Benzer ürünler</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} favorite={favSet.has(p.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
