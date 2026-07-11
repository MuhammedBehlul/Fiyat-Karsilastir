// Saf TypeScript tipleri — Next.js'e bağımlılık yok (React Native'e taşınabilir).

export const SITES = ['trendyol', 'hepsiburada', 'amazon', 'vatan', 'n11'] as const;

export type SiteName = (typeof SITES)[number];

export const SITE_LABELS: Record<SiteName, string> = {
  trendyol: 'Trendyol',
  hepsiburada: 'Hepsiburada',
  amazon: 'Amazon.com.tr',
  vatan: 'Vatan Bilgisayar',
  n11: 'N11',
};

import type { VariantAttrs } from './variant';

/** Taranan kategoriler: slug -> görünen ad. */
export const CATEGORIES = {
  telefon: 'Telefon',
  laptop: 'Laptop',
  kulaklik: 'Kulaklık',
  'ev-aletleri': 'Ev Aletleri',
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

/** Bir scraper'ın listeleme sayfasından çıkardığı ham ürün kaydı. */
export interface ScrapedProduct {
  siteName: SiteName;
  name: string;
  price: number;
  currency: string;
  productUrl: string;
  imageUrl?: string;
  /** Hangi kategori listelemesinden geldiği (engine doldurur). */
  categorySlug: CategorySlug;
  /** Sayfanın yapılandırılmış alanlarından okunan nitelikler (başlık ayrıştırmasına üstün gelir). */
  attrs?: Partial<VariantAttrs>;
}

/** Kategori listesi filtreleri (URL parametrelerinden ayrıştırılır). */
export interface CategoryFilters {
  brand?: string[];
  storageGb?: number[];
  ramGb?: number[];
  color?: string[];
  minPrice?: number;
  maxPrice?: number;
  /** true: yalnızca 2+ mağazada fiyatı olan (karşılaştırılabilir) varyantlar. */
  comparableOnly?: boolean;
}

export type CategorySort = 'popular' | 'price-asc' | 'price-desc' | 'newest';

export interface PagedResult<T> {
  items: T[];
  total: number;
}

/** Filtre panelinin seçenekleri: kategoride gerçekten var olan değerler. */
export interface CategoryFacets {
  totalCount: number;
  /** 2+ mağazada fiyatı olan varyant sayısı ("X üründen Y'si karşılaştırılıyor"). */
  comparableCount: number;
  brands: { value: string; count: number }[];
  storageGb: number[];
  ramGb: number[];
  colors: { slug: string; count: number }[];
  /** Kategorideki güncel en ucuz fiyat aralığı (fiyat input placeholder'ları için). */
  priceMin: number | null;
  priceMax: number | null;
}

/** Gün bazındaki en ucuz fiyatın son iki tarama günü arasındaki değişimi. */
export interface PriceTrend {
  direction: 'up' | 'down' | 'flat';
  /** Mutlak yüzde değişim (ör. 2.4). direction 'flat' ise 0'a yakındır. */
  percent: number;
}

/**
 * UI katmanının kullandığı, siteler arası birleştirilmiş görünüm.
 * Bir kayıt = bir VARYANT (ör. "iPhone 15 128 GB Mavi"); id de varyant id'sidir.
 */
export interface ProductWithPrices {
  id: number;
  name: string;
  /** Kanonik marka görünen adı (ör. "Apple"); tanınmadıysa null. */
  brand: string | null;
  imageUrl: string | null;
  categorySlug: string | null;
  /** Varyant imzası — filtreler ve kart üstü teknik özet satırı için. */
  storageGb: number | null;
  ramGb: number | null;
  /** Kanonik renk slug'ı; variantLabel() ile insan-okur hale getirilir. */
  color: string | null;
  prices: {
    siteName: SiteName;
    price: number;
    currency: string;
    productUrl: string;
    scrapedAt: string;
  }[];
  /** Yeterli geçmiş yoksa (tek tarama günü) null. */
  trend: PriceTrend | null;
}
