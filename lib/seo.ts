// SEO yardımcıları: mutlak URL üretimi + JSON-LD (schema.org) veri nesneleri.
// Next.js importu yok — sayfa bileşenleri bu saf nesneleri <script type="application/ld+json">
// içine serileştirir (bkz. components/JsonLd.tsx).

import type { ProductWithPrices, SiteName } from './types';
import { SITE_LABELS } from './types';

/** Prod domaini NEXT_PUBLIC_SITE_URL'den okunur; tanımsızsa yerel geliştirmeye düşer. */
export function siteUrl(path = ''): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
}

export interface JsonLdBreadcrumbItem {
  label: string;
  href?: string;
}

export function buildBreadcrumbJsonLd(items: JsonLdBreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: siteUrl(item.href) } : {}),
    })),
  };
}

/** Ürün varyantı için Product + AggregateOffer/Offer şeması (fiyat karşılaştırma sayfaları için standart desen). */
export function buildProductJsonLd(product: ProductWithPrices) {
  const cheapest = product.prices[0];
  if (!cheapest) return null;
  const priciest = product.prices[product.prices.length - 1];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.imageUrl ? { image: [product.imageUrl] } : {}),
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: cheapest.currency,
      lowPrice: cheapest.price,
      highPrice: priciest.price,
      offerCount: product.prices.length,
      offers: product.prices.map((p) => ({
        '@type': 'Offer',
        price: p.price,
        priceCurrency: p.currency,
        url: p.productUrl,
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: SITE_LABELS[p.siteName as SiteName] },
      })),
    },
  };
}
