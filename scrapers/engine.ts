// Ortak scraper motoru: kategori listelemeleri + sayfalama; fetch dene,
// engellenirsen Playwright'a düş, parse et. Sayfalar arası nazik gecikme.

import type { CategorySlug, ScrapedProduct, SiteName } from '../lib/types';
import type { VariantAttrs } from '../lib/variant';
import { BlockedError, fetchHtml, politeDelay } from './http';
import { fetchHtmlWithBrowser } from './browser';

/** Kategori başına gezilecek sayfa üst sınırı (SCRAPE_MAX_PAGES ile ayarlanır, 1-10). */
export function maxPagesPerCategory(): number {
  const n = Number(process.env.SCRAPE_MAX_PAGES ?? 5);
  return Number.isFinite(n) ? Math.min(10, Math.max(1, Math.floor(n))) : 5;
}

export interface CategoryListing {
  category: CategorySlug;
  /** İlk sayfa URL'i. */
  url: string;
  /**
   * 2. ve sonraki sayfaların URL üreticisi. Tanımsızsa yalnızca ilk sayfa
   * çekilir (ör. Vatan: robots.txt "?page=" parametresini yasaklıyor;
   * Amazon: /b browse sayfalarında klasik sayfalama yok).
   */
  pageUrl?: (page: number) => string;
}

/** parse() kategori bilmez; engine hangi listelemeden geldiyse onu damgalar. */
export type ParsedItem = Omit<ScrapedProduct, 'categorySlug'>;

export interface SiteScraper {
  site: SiteName;
  listings: CategoryListing[];
  /** true ise fetch hiç denenmez, doğrudan Playwright kullanılır. */
  useBrowser?: boolean;
  /** Playwright'ta ürünlerin yüklendiğini gösteren selector. */
  waitForSelector?: string;
  /** Başlıkta varyant bilgisi eksikse detay sayfasından yapılandırılmış nitelik getirir. */
  enrichDetail?(url: string): Promise<Partial<VariantAttrs>>;
  parse(html: string): ParsedItem[];
}

export interface SiteResult {
  site: SiteName;
  products: ScrapedProduct[];
  usedBrowser: boolean;
  pagesFetched: number;
  errors: string[];
}

export async function runScraper(scraper: SiteScraper): Promise<SiteResult> {
  const products: ScrapedProduct[] = [];
  const errors: string[] = [];
  const seenUrls = new Set<string>();
  let usedBrowser = scraper.useBrowser ?? false;
  let pagesFetched = 0;
  let firstRequest = true;
  const pageCap = maxPagesPerCategory();

  // SSR HTML ve scroll sonrası DOM'dan hangisi daha çok ürün veriyorsa onu kullan
  // (örn. Trendyol SSR'da 24 kart gönderip hydration sonrası grid'i virtualize ediyor).
  const parseViaBrowser = async (url: string) => {
    const { ssrHtml, domHtml } = await fetchHtmlWithBrowser(url, scraper.waitForSelector);
    const fromSsr = ssrHtml ? scraper.parse(ssrHtml) : [];
    const fromDom = scraper.parse(domHtml);
    return fromSsr.length >= fromDom.length ? fromSsr : fromDom;
  };

  const fetchPage = async (url: string, page: number): Promise<ParsedItem[]> => {
    if (!firstRequest) await politeDelay();
    firstRequest = false;
    pagesFetched++;
    if (usedBrowser) return parseViaBrowser(url);
    try {
      const found = scraper.parse(await fetchHtml(url));
      if (found.length > 0) return found;
      // 2+ sayfada boş sonuç normaldir (kategori bitti) — tarayıcıyı boşuna
      // devreye sokma; hele Hepsiburada'da headless challenge yediğinden sonraki
      // TÜM kategorileri de çökertir. Yalnızca İLK sayfa boşsa şüphelen.
      if (page > 1) return found;
      console.warn(`[${scraper.site}] fetch HTML'inde ürün bulunamadı (${url}), Playwright deneniyor`);
    } catch (err) {
      if (!(err instanceof BlockedError)) throw err;
      console.warn(`[${scraper.site}] fetch engellendi (${err.message}), Playwright fallback deneniyor`);
    }
    // Bot koruması ya da boş ilk sayfa: bu siteyi bundan sonra Playwright ile çek.
    usedBrowser = true;
    const viaBrowser = await parseViaBrowser(url);
    // Tarayıcı da boş döndüyse (ör. Hepsiburada headless'a challenge veriyor)
    // kalıcı geçiş yapma: sonraki kategoriler fetch ile şansını denesin.
    if (viaBrowser.length === 0) usedBrowser = false;
    return viaBrowser;
  };

  for (const listing of scraper.listings) {
    const cap = listing.pageUrl ? pageCap : 1;
    for (let page = 1; page <= cap; page++) {
      const url = page === 1 ? listing.url : listing.pageUrl!(page);
      let found: ParsedItem[];
      try {
        found = await fetchPage(url, page);
      } catch (err) {
        errors.push(`${url}: ${(err as Error).message}`);
        break; // bu kategorinin kalan sayfalarını zorlama, sıradaki kategoriye geç
      }
      // Site sayfa sınırını aşınca genelde son sayfayı/ilk sayfayı tekrarlar:
      // yeni URL çıkmadıysa kategori bitti demektir.
      let fresh = 0;
      for (const p of found) {
        if (seenUrls.has(p.productUrl)) continue;
        seenUrls.add(p.productUrl);
        p.name = p.name.replace(/\s+/g, ' ').trim();
        products.push({ ...p, categorySlug: listing.category });
        fresh++;
      }
      if (found.length === 0 || fresh === 0) break;
    }
  }

  return { site: scraper.site, products, usedBrowser, pagesFetched, errors };
}
