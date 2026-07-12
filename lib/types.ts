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

/** Taranan yaprak kategoriler: slug -> görünen ad. Tarama/eşleştirme birimi budur. */
export const CATEGORIES = {
  telefon: 'Telefon',
  laptop: 'Laptop',
  kulaklik: 'Kulaklık',
  'ev-aletleri': 'Ev Aletleri',
  'ev-yasam': 'Ev & Yaşam',
  'anne-bebek': 'Anne & Bebek',
  moda: 'Moda & Aksesuar',
  'kitap-muzik-hobi': 'Kitap, Müzik & Hobi',
  'spor-outdoor': 'Spor & Outdoor',
  kozmetik: 'Kozmetik & Kişisel Bakım',
  'oto-bahce-yapi': 'Oto, Bahçe & Yapı Market',
  petshop: 'Petshop',
  supermarket: 'Süpermarket',
} as const;

export type CategorySlug = keyof typeof CATEGORIES;

/**
 * Üst düzey menü grupları (cimri tarzı): navigasyon içindir, tarama birimi
 * DEĞİLDİR — scraper/eşleştirme/aksesuar kalıpları yaprak slug'larla çalışır.
 * Nesne anahtar sırası navbar'daki görünüm sırasıdır.
 */
export const CATEGORY_GROUPS = {
  elektronik: {
    label: 'Elektronik, Cep Telefonu',
    categories: ['telefon', 'laptop', 'kulaklik', 'ev-aletleri'],
  },
  'ev-yasam': { label: 'Ev, Yaşam, Ofis, Kırtasiye', categories: ['ev-yasam'] },
  'anne-bebek': { label: 'Anne, Bebek, Oyuncak', categories: ['anne-bebek'] },
  moda: { label: 'Saat, Moda, Takı, Ayakkabı', categories: ['moda'] },
  'kitap-muzik-hobi': { label: 'Kitap, Müzik, Hobi', categories: ['kitap-muzik-hobi'] },
  'spor-outdoor': { label: 'Spor, Outdoor', categories: ['spor-outdoor'] },
  kozmetik: { label: 'Sağlık, Bakım, Kozmetik', categories: ['kozmetik'] },
  'oto-bahce-yapi': { label: 'Oto, Bahçe, Yapı Market', categories: ['oto-bahce-yapi'] },
  petshop: { label: 'Petshop', categories: ['petshop'] },
  supermarket: { label: 'Süpermarket', categories: ['supermarket'] },
} as const satisfies Record<string, { label: string; categories: readonly CategorySlug[] }>;

export type CategoryGroupSlug = keyof typeof CATEGORY_GROUPS;

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

/** Arama otomatik tamamlama önerisi (hafif — tam ProductWithPrices değil). */
export interface SearchSuggestion {
  id: number;
  name: string;
  imageUrl: string | null;
  price: number | null;
  siteCount: number;
}
