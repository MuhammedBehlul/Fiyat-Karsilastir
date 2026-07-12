// Sorgu katmanının Next.js cache'iyle sarılmış hali. Sayfalar buradan import eder;
// lib/queries.ts saf kalır (scraper ve olası React Native aynı katmanı Next'siz kullanır).
//
// Veri günde bir kez değiştiği için 1 saatlik revalidate yeterli. Scraper işi
// bitince /api/revalidate üzerinden CATALOG_TAG'i düşürüp beklemeden tazeleyebilir.

import { unstable_cache } from 'next/cache';
import * as queries from './queries';

export const CATALOG_TAG = 'catalog';

const opts = { revalidate: 3600, tags: [CATALOG_TAG] };

export const getCategories = unstable_cache(queries.getCategories, ['categories'], opts);
export const getFeaturedProducts = unstable_cache(queries.getFeaturedProducts, ['featured'], opts);
// getProductsByCategory bilerek burada YOK: filtre kombinasyonları sınırsız cache
// anahtarı üretir; kategori sayfası zaten force-dynamic, lib/queries'ten direkt çağrılır.
export const getCategoryFacets = unstable_cache(queries.getCategoryFacets, ['category-facets'], opts);
export const searchProducts = unstable_cache(queries.searchProducts, ['search'], opts);
export const getProductWithPrices = unstable_cache(queries.getProductWithPrices, ['product'], opts);
export const getPriceHistory = unstable_cache(queries.getPriceHistory, ['price-history'], opts);
export const getTopPriceDrops = unstable_cache(queries.getTopPriceDrops, ['price-drops'], opts);
export const getCatalogStats = unstable_cache(queries.getCatalogStats, ['catalog-stats'], opts);
export const getSitemapEntries = unstable_cache(queries.getSitemapEntries, ['sitemap-entries'], opts);
