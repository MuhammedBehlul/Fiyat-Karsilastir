// Veri erişim katmanı — UI'dan bağımsız, Next.js importu yok.
// Tüm fonksiyonlar düz (serileştirilebilir) nesneler döner; React Native de aynı katmanı kullanabilir.
//
// Görünüm birimi VARYANTTIR: "iPhone 15 128 GB Mavi" bir kayıt, 256 GB'ı ayrı kayıt.
// Farklı depolama/renk fiyatları asla birbirine karıştırılmaz.

import { prisma } from './db';
import { Prisma } from './generated/prisma/client';
import { foldTurkish } from './variant';
import type {
  CategoryFacets,
  CategoryFilters,
  CategorySort,
  PagedResult,
  PriceTrend,
  ProductWithPrices,
  SiteName,
} from './types';

type VariantRow = {
  id: number;
  displayName: string;
  imageUrl: string | null;
  storageGb: number | null;
  ramGb: number | null;
  color: string | null;
  product: { brand: string | null; imageUrl: string | null; category: { slug: string } | null };
  priceEntries: {
    siteName: string;
    price: unknown; // Prisma Decimal
    currency: string;
    productUrl: string;
    scrapedAt: Date;
  }[];
};

/**
 * Trend: gün bazında (tüm siteler içindeki) en ucuz fiyat çıkarılır,
 * son iki tarama günü karşılaştırılır. Ek sorgu gerekmez — variantInclude'un
 * getirdiği son kayıtlar yeterlidir.
 */
function computeTrend(entries: VariantRow['priceEntries']): PriceTrend | null {
  const cheapestByDay = new Map<string, number>();
  for (const e of entries) {
    const day = e.scrapedAt.toISOString().slice(0, 10);
    const price = Number(e.price);
    const current = cheapestByDay.get(day);
    if (current === undefined || price < current) cheapestByDay.set(day, price);
  }
  const days = [...cheapestByDay.keys()].sort();
  if (days.length < 2) return null;
  const latest = cheapestByDay.get(days[days.length - 1])!;
  const previous = cheapestByDay.get(days[days.length - 2])!;
  if (previous <= 0) return null;
  const change = ((latest - previous) / previous) * 100;
  const direction = Math.abs(change) < 0.1 ? 'flat' : change > 0 ? 'up' : 'down';
  return { direction, percent: Math.abs(change) };
}

/** Her site için yalnızca en güncel fiyatı bırakır, ucuzdan pahalıya sıralar. */
function toProductWithPrices(row: VariantRow): ProductWithPrices {
  const latestBySite = new Map<string, VariantRow['priceEntries'][number]>();
  for (const entry of row.priceEntries) {
    const existing = latestBySite.get(entry.siteName);
    if (!existing || entry.scrapedAt > existing.scrapedAt) latestBySite.set(entry.siteName, entry);
  }
  const prices = [...latestBySite.values()]
    .map((e) => ({
      siteName: e.siteName as SiteName,
      price: Number(e.price),
      currency: e.currency,
      productUrl: e.productUrl,
      scrapedAt: e.scrapedAt.toISOString(),
    }))
    .sort((a, b) => a.price - b.price);
  return {
    id: row.id,
    name: row.displayName,
    brand: row.product.brand,
    imageUrl: row.imageUrl ?? row.product.imageUrl,
    categorySlug: row.product.category?.slug ?? null,
    storageGb: row.storageGb,
    ramGb: row.ramGb,
    color: row.color,
    prices,
    trend: computeTrend(row.priceEntries),
  };
}

const variantInclude = {
  product: { select: { brand: true, imageUrl: true, category: { select: { slug: true } } } },
  priceEntries: {
    select: { siteName: true, price: true, currency: true, productUrl: true, scrapedAt: true },
    orderBy: { scrapedAt: 'desc' as const },
    take: 15, // 5 site × ~3 gün: site başına en güncel fiyat + trend (son 2 gün) için yeterli
  },
};

/**
 * Varyant başına "güncel fiyat": her site için en güncel kayıt, sonra bunların
 * en ucuzu + kaç farklı sitede görüldüğü. toProductWithPrices'taki mantıkla
 * birebir aynı — liste/facet sorgularında paylaşılır ki tutarsızlık olmasın.
 */
const VARIANT_PRICE_CTE = Prisma.sql`
  WITH latest_per_site AS (
    SELECT DISTINCT ON (pe.variant_id, pe.site_name)
      pe.variant_id, pe.site_name, pe.price
    FROM price_entries pe
    ORDER BY pe.variant_id, pe.site_name, pe.scraped_at DESC
  ),
  variant_price AS (
    SELECT variant_id, MIN(price) AS min_price, COUNT(DISTINCT site_name) AS site_count
    FROM latest_per_site
    GROUP BY variant_id
  )
`;

/**
 * Arama: sorgu kelimelerinin tamamı searchKey içinde geçen varyantlar.
 * Üst sınıra kadar TÜM eşleşmeler döner (arama sorguları dardır); sayfalama
 * çağıran tarafta dilimlemeyle yapılır ki sıralama liste genelinde tutarlı kalsın.
 */
export async function searchProducts(query: string, limit = 240): Promise<ProductWithPrices[]> {
  const tokens = foldTurkish(query)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
  if (tokens.length === 0) return [];
  const rows = await prisma.productVariant.findMany({
    where: { AND: tokens.map((t) => ({ searchKey: { contains: t } })) },
    include: variantInclude,
    take: limit,
  });
  return rows
    .map(toProductWithPrices)
    .filter((p) => p.prices.length > 0)
    .sort((a, b) => b.prices.length - a.prices.length);
}

export async function getProductWithPrices(id: number): Promise<ProductWithPrices | null> {
  const row = await prisma.productVariant.findUnique({ where: { id }, include: variantInclude });
  return row ? toProductWithPrices(row) : null;
}

/**
 * Öne çıkanlar: birden çok sitede fiyatı bulunan (karşılaştırılabilir) varyantlar.
 * Aday seçimi SQL'de yapılır — "en yeni N ürünü çek, JS'te filtrele" yaklaşımı
 * yanıltıcıydı: ürünler site site toplu yaratıldığından en yeni dilim tek siteli
 * ürünlerle dolabiliyor ve karşılaştırılabilirler hiç yakalanmıyordu.
 */
export async function getFeaturedProducts(limit = 8, categorySlug?: string): Promise<ProductWithPrices[]> {
  // Kategori kapsaması opsiyonel ve tamamen ekleyici: parametresiz çağrılar
  // (ana sayfa) eskisi gibi tüm kataloğa bakar.
  const categoryJoin = categorySlug
    ? Prisma.sql`
        JOIN product_variants pv ON pv.id = pe.variant_id
        JOIN products p ON p.id = pv.product_id
        JOIN categories c ON c.id = p.category_id AND c.slug = ${categorySlug}`
    : Prisma.empty;
  const candidates = await prisma.$queryRaw<{ variant_id: number }[]>`
    SELECT pe.variant_id
    FROM price_entries pe
    ${categoryJoin}
    GROUP BY pe.variant_id
    HAVING COUNT(DISTINCT pe.site_name) >= 2
    ORDER BY COUNT(DISTINCT pe.site_name) DESC
    LIMIT 100
  `;
  if (candidates.length === 0) return [];
  const rows = await prisma.productVariant.findMany({
    where: { id: { in: candidates.map((c) => c.variant_id) } },
    include: variantInclude,
  });
  return rows
    .map(toProductWithPrices)
    .filter((p) => p.prices.length >= 2)
    .sort((a, b) => b.prices.length - a.prices.length)
    .slice(0, limit);
}

// Tipler lib/types.ts'te yaşar (istemci bileşenleri prisma'ya dokunmadan alabilsin);
// eski import yolları bozulmasın diye buradan da yeniden dışa aktarılır.
export type { CategoryFacets, CategoryFilters, CategorySort, PagedResult };

/**
 * Kategori listesi: filtre + sıralama + sayfalama. Fiyat PriceEntry'de yaşadığı
 * için "güncel en ucuz fiyat" kolonu yok — aday seçimi VARIANT_PRICE_CTE ile ham
 * SQL'de yapılır (getFeaturedProducts'taki iki adımlı desenle aynı), ardından
 * seçilen id'ler variantInclude ile zenginleştirilir.
 *
 * Bilinçli olarak lib/cached.ts'te sarılmaz: filtre kombinasyonları sınırsız
 * cache anahtarı üretirdi; bu ölçekte Postgres okuması zaten ucuz.
 */
export async function getProductsByCategory(
  slug: string,
  opts: { filters?: CategoryFilters; sort?: CategorySort; page?: number; pageSize?: number } = {},
): Promise<PagedResult<ProductWithPrices>> {
  const { filters = {}, sort = 'price-asc', page = 1, pageSize = 24 } = opts;

  const conditions: Prisma.Sql[] = [Prisma.sql`c.slug = ${slug}`];
  if (filters.brand?.length) conditions.push(Prisma.sql`p.brand IN (${Prisma.join(filters.brand)})`);
  if (filters.storageGb?.length)
    conditions.push(Prisma.sql`pv.storage_gb IN (${Prisma.join(filters.storageGb)})`);
  if (filters.ramGb?.length) conditions.push(Prisma.sql`pv.ram_gb IN (${Prisma.join(filters.ramGb)})`);
  if (filters.color?.length) conditions.push(Prisma.sql`pv.color IN (${Prisma.join(filters.color)})`);
  if (filters.minPrice != null) conditions.push(Prisma.sql`vp.min_price >= ${filters.minPrice}`);
  if (filters.maxPrice != null) conditions.push(Prisma.sql`vp.min_price <= ${filters.maxPrice}`);
  if (filters.comparableOnly) conditions.push(Prisma.sql`vp.site_count >= 2`);
  const where = Prisma.join(conditions, ' AND ');

  const orderBy =
    sort === 'price-desc'
      ? Prisma.sql`vp.min_price DESC NULLS LAST`
      : sort === 'price-asc'
        ? Prisma.sql`vp.min_price ASC`
        : Prisma.sql`pv.created_at DESC`;

  const rows = await prisma.$queryRaw<{ variant_id: number; total_count: bigint }[]>`
    ${VARIANT_PRICE_CTE}
    SELECT pv.id AS variant_id, COUNT(*) OVER() AS total_count
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    JOIN categories c ON c.id = p.category_id
    JOIN variant_price vp ON vp.variant_id = pv.id
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
  `;
  if (rows.length === 0) return { items: [], total: 0 };

  const total = Number(rows[0].total_count);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: rows.map((r) => r.variant_id) } },
    include: variantInclude,
  });
  const byId = new Map(variants.map((v) => [v.id, v]));
  // SQL'in sıralaması korunur — findMany id sırasını garanti etmez.
  const items = rows.flatMap((r) => {
    const v = byId.get(r.variant_id);
    return v ? [toProductWithPrices(v)] : [];
  });
  return { items, total };
}

/**
 * Filtre panelinin seçenekleri: kategoride gerçekten VAR OLAN marka/kapasite/renk
 * değerleri (sıfır sonuçlu seçenek gösterilmez). Sayımlar kategori genelini
 * yansıtır, uygulanan filtre kombinasyonunu değil — kombinasyon başına yeniden
 * hesap bu ölçekte gereksiz maliyet olurdu. Kategori başına tek cache girdisi.
 */
export async function getCategoryFacets(slug: string): Promise<CategoryFacets> {
  const [brandRows, storageGroups, ramGroups, colorGroups, statsRow] = await Promise.all([
    prisma.$queryRaw<{ brand: string; cnt: bigint }[]>`
      SELECT p.brand, COUNT(pv.id) AS cnt
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      JOIN categories c ON c.id = p.category_id
      WHERE c.slug = ${slug} AND p.brand IS NOT NULL
      GROUP BY p.brand
      ORDER BY cnt DESC
    `,
    prisma.productVariant.groupBy({
      by: ['storageGb'],
      where: { product: { category: { slug } }, storageGb: { not: null } },
      _count: true,
    }),
    prisma.productVariant.groupBy({
      by: ['ramGb'],
      where: { product: { category: { slug } }, ramGb: { not: null } },
      _count: true,
    }),
    prisma.productVariant.groupBy({
      by: ['color'],
      where: { product: { category: { slug } }, color: { not: null } },
      _count: true,
    }),
    prisma.$queryRaw<
      { total: bigint; comparable: bigint; min_price: number | null; max_price: number | null }[]
    >`
      ${VARIANT_PRICE_CTE}
      SELECT COUNT(*) AS total,
             COUNT(*) FILTER (WHERE vp.site_count >= 2) AS comparable,
             MIN(vp.min_price) AS min_price,
             MAX(vp.min_price) AS max_price
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN variant_price vp ON vp.variant_id = pv.id
      WHERE c.slug = ${slug}
    `,
  ]);

  const s = statsRow[0];
  return {
    totalCount: Number(s?.total ?? 0),
    comparableCount: Number(s?.comparable ?? 0),
    brands: brandRows.map((r) => ({ value: r.brand, count: Number(r.cnt) })),
    storageGb: storageGroups.map((g) => g.storageGb!).sort((a, b) => a - b),
    ramGb: ramGroups.map((g) => g.ramGb!).sort((a, b) => a - b),
    colors: colorGroups.map((g) => ({ slug: g.color!, count: g._count })),
    priceMin: s?.min_price != null ? Number(s.min_price) : null,
    priceMax: s?.max_price != null ? Number(s.max_price) : null,
  };
}

export async function getCategories(): Promise<{ id: number; name: string; slug: string }[]> {
  return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export interface PriceDrop {
  id: number;
  name: string;
  imageUrl: string | null;
  currentPrice: number;
  previousPrice: number;
  percent: number;
}

/**
 * Fiyatı en çok düşen varyantlar: her varyant için günlük en ucuz fiyat çıkarılır,
 * son iki tarama gününün en ucuzları karşılaştırılır. Yalnızca gerçekten
 * düşenler döner (varyant başına bir kayıt). Veri henüz tek günlükse boş döner.
 */
export async function getTopPriceDrops(limit = 8, categorySlug?: string): Promise<PriceDrop[]> {
  const categoryJoin = categorySlug
    ? Prisma.sql`
        JOIN product_variants pv ON pv.id = latest.variant_id
        JOIN products p ON p.id = pv.product_id
        JOIN categories c ON c.id = p.category_id AND c.slug = ${categorySlug}`
    : Prisma.empty;
  const rows = await prisma.$queryRaw<
    { variant_id: number; current_price: number; previous_price: number }[]
  >`
    WITH daily_min AS (
      SELECT variant_id, scraped_at::date AS day, MIN(price) AS min_price
      FROM price_entries
      GROUP BY variant_id, scraped_at::date
    ),
    ranked AS (
      SELECT variant_id, day, min_price,
             ROW_NUMBER() OVER (PARTITION BY variant_id ORDER BY day DESC) AS rn
      FROM daily_min
    )
    SELECT latest.variant_id AS variant_id,
           latest.min_price AS current_price,
           prev.min_price AS previous_price
    FROM ranked latest
    JOIN ranked prev ON prev.variant_id = latest.variant_id AND prev.rn = 2
    ${categoryJoin}
    WHERE latest.rn = 1 AND latest.min_price < prev.min_price
    ORDER BY (prev.min_price - latest.min_price) / prev.min_price DESC
    LIMIT ${limit}
  `;
  if (rows.length === 0) return [];

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: rows.map((r) => r.variant_id) } },
    select: { id: true, displayName: true, imageUrl: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  return rows.flatMap((r) => {
    const variant = byId.get(r.variant_id);
    if (!variant) return [];
    const currentPrice = Number(r.current_price);
    const previousPrice = Number(r.previous_price);
    return [
      {
        id: variant.id,
        name: variant.displayName,
        imageUrl: variant.imageUrl,
        currentPrice,
        previousPrice,
        percent: ((previousPrice - currentPrice) / previousPrice) * 100,
      },
    ];
  });
}

/** Hero istatistikleri için: takip edilen toplam varyant (SKU) sayısı. */
export async function getCatalogStats(): Promise<{ productCount: number }> {
  const productCount = await prisma.productVariant.count();
  return { productCount };
}

/** Fiyat geçmişi: gün + site bazında son fiyat (grafik için). id = varyant id. */
export async function getPriceHistory(
  variantId: number,
): Promise<{ date: string; siteName: SiteName; price: number }[]> {
  const entries = await prisma.priceEntry.findMany({
    where: { variantId },
    orderBy: { scrapedAt: 'asc' },
    select: { siteName: true, price: true, scrapedAt: true },
  });
  // Aynı gün aynı siteden birden çok kayıt varsa sonuncusu geçerli.
  const byDaySite = new Map<string, { date: string; siteName: SiteName; price: number }>();
  for (const e of entries) {
    const date = e.scrapedAt.toISOString().slice(0, 10);
    byDaySite.set(`${date}|${e.siteName}`, {
      date,
      siteName: e.siteName as SiteName,
      price: Number(e.price),
    });
  }
  return [...byDaySite.values()];
}

export async function getLastScrapeRuns(limit = 25) {
  const runs = await prisma.scrapeRun.findMany({ orderBy: { startedAt: 'desc' }, take: limit });
  return runs.map((r) => ({
    ...r,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
  }));
}

/** İnceleme bekleyen eşleşme adayları (/admin görünümü için). */
export async function getPendingMatchReviews(limit = 50) {
  const rows = await prisma.matchReview.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((r) => ({
    ...r,
    price: Number(r.price),
    createdAt: r.createdAt.toISOString(),
  }));
}
