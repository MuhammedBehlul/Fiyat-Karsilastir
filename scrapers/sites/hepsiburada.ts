import * as cheerio from 'cheerio';
import type { CategorySlug } from '../../lib/types';
import { parseTurkishPrice, pickImageUrl } from '../../lib/normalize';
import type { ParsedItem, SiteScraper } from '../engine';

const BASE = 'https://www.hepsiburada.com';

// Sayfalama: ?sayfa=N (robots.txt engellemiyor).
const listing = (category: CategorySlug, path: string) => ({
  category,
  url: `${BASE}/${path}`,
  pageUrl: (page: number) => `${BASE}/${path}?sayfa=${page}`,
});

// Hepsiburada Akamai tarzı bot koruması kullanıyor. Testlerde tam Chrome header
// setiyle düz fetch çalışırken headless tarayıcıya challenge sayfası dönüyor;
// bu yüzden önce fetch denenir, Playwright yalnızca fallback.
export const hepsiburada: SiteScraper = {
  site: 'hepsiburada',
  listings: [
    listing('telefon', 'telefonlar-c-2147483642'),
    listing('laptop', 'laptop-notebook-dizustu-bilgisayarlar-c-98'),
    listing('kulaklik', 'kulakliklar-c-520'),
    listing('ev-aletleri', 'elektrikli-ev-aletleri-c-17071'),
  ],
  waitForSelector: 'li[class*="productListContent"]',
  parse(html) {
    const $ = cheerio.load(html);
    const products: ParsedItem[] = [];
    $('li[class*="productListContent"]').each((_, el) => {
      const card = $(el);
      const link = card.find('a[href*="-p-"], a[href*="-pm-"]').first();
      const href = link.attr('href');
      const name =
        card.find('[data-test-id="product-card-name"]').text().trim() ||
        link.attr('title')?.trim() ||
        card.find('h2, h3').first().text().trim();
      const priceText = card
        .find('[data-test-id^="final-price"], [class*="finalPrice"], [class*="price-module_finalPrice"]')
        .first()
        .text();
      const price = parseTurkishPrice(priceText);
      if (!name || !href || Number.isNaN(price)) return;
      products.push({
        siteName: 'hepsiburada',
        name,
        price,
        currency: 'TRY',
        productUrl: href.startsWith('http') ? href.split('?')[0] : BASE + href.split('?')[0],
        // '.first()' düz "img" ile bazen kampanya rozetini (badge-module_badgeImg...)
        // gerçek ürün fotoğrafından önce yakalıyordu; ürün görseli hep "hbImage" sınıflı
        // <img> olduğundan onu hedefliyoruz (yoksa rozet yerine temiz placeholder gösterilir).
        imageUrl: pickImageUrl(card.find('img[class*="hbImage"]').first().attr('src')),
      });
    });
    return products;
  },
};
