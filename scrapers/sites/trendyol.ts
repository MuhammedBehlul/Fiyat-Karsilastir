import * as cheerio from 'cheerio';
import type { CategorySlug } from '../../lib/types';
import { parseTurkishPrice, pickImageUrl } from '../../lib/normalize';
import type { ParsedItem, SiteScraper } from '../engine';

const BASE = 'https://www.trendyol.com';

// Sayfalama: ?pi=N — robots.txt yalnızca locale önekli ve nitelik filtreli
// (-a*-v*) URL'lerde pi'yi yasaklıyor; düz kategori sayfalarında serbest.
const listing = (category: CategorySlug, path: string) => ({
  category,
  url: `${BASE}/${path}`,
  pageUrl: (page: number) => `${BASE}/${path}?pi=${page}`,
});

export const trendyol: SiteScraper = {
  site: 'trendyol',
  listings: [
    listing('telefon', 'telefon-x-c104025'),
    listing('laptop', 'laptop-x-c103108'),
    listing('kulaklik', 'bluetooth-kulaklik-x-c108626'),
    listing('ev-aletleri', 'elektrikli-ev-aletleri-x-c1104'),
  ],
  waitForSelector: '.search-result-content a.product-card',
  parse(html) {
    const $ = cheerio.load(html);
    const products: ParsedItem[] = [];
    $('.search-result-content a.product-card').each((_, el) => {
      const card = $(el);
      const name = card.find('.title').attr('title')?.trim() || card.find('.title').text().trim();
      // Üç fiyat varyantı var: indirimli (sale-price), tek fiyat (price-section),
      // sepette indirim (basket-promo-price-wrapper: "Sepette10.599 TL10.899 TL" — ilk sayı geçerli fiyat).
      const priceText = [
        card.find('[data-testid="sale-price"], .sale-price').first().text(),
        card.find('.single-price .price-section').first().text(),
        card.find('.basket-promo-price-wrapper').first().text(),
      ].find((t) => t.trim());
      const price = parseTurkishPrice(priceText ?? '');
      const href = card.attr('href');
      if (!name || !href || Number.isNaN(price)) return;
      // Query parametrelerini at: robots.txt birçoğunu yasaklıyor, kanonik URL yeterli.
      const productUrl = BASE + href.split('?')[0];
      products.push({
        siteName: 'trendyol',
        name,
        price,
        currency: 'TRY',
        productUrl,
        imageUrl: pickImageUrl(card.find('img.image').first().attr('src')),
      });
    });
    return products;
  },
};
