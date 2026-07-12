import * as cheerio from 'cheerio';
import { parseTurkishPrice, pickImageUrl } from '../../lib/normalize';
import type { ParsedItem, SiteScraper } from '../engine';

const BASE = 'https://www.vatanbilgisayar.com';

export const vatan: SiteScraper = {
  site: 'vatan',
  // robots.txt "?page=" parametresini yasaklıyor; kategori başına yalnızca ilk sayfa.
  // Vatan elektronik odaklı: yeni taksonomiden yalnızca "Sağlık, Bakım, Kozmetik"
  // grubuna makul bir karşılık var (elektrikli kişisel bakım cihazları — canlı
  // doğrulandı 2026-07-12). Petshop/süpermarket/moda vb. bu sitede yok; kategori
  // başına 5 site şartı yok, uydurma eşleme yapılmaz.
  listings: [
    { category: 'telefon', url: `${BASE}/cep-telefonu-modelleri/` },
    { category: 'laptop', url: `${BASE}/notebook/` },
    { category: 'kulaklik', url: `${BASE}/bluetooth-kulaklik-mikrofon/` },
    { category: 'ev-aletleri', url: `${BASE}/elektrikli-ev-aletleri/` },
    { category: 'kozmetik', url: `${BASE}/kisisel-bakim-urunleri/` },
  ],
  waitForSelector: '.product-list',
  parse(html) {
    const $ = cheerio.load(html);
    const products: ParsedItem[] = [];
    $('.product-list').each((_, el) => {
      const card = $(el);
      const name = card.find('.product-list__product-name, h3').first().text().trim();
      const price = parseTurkishPrice(card.find('.product-list__price').first().text());
      const href = card.find('a').first().attr('href');
      if (!name || !href || Number.isNaN(price)) return;
      const img = card.find('img').first();
      products.push({
        siteName: 'vatan',
        name,
        price,
        currency: 'TRY',
        productUrl: href.startsWith('http') ? href : BASE + href,
        // Lazy-load: gerçek görsel data-src'de, src placeholder olabilir.
        imageUrl: pickImageUrl(img.attr('data-src'), img.attr('data-original'), img.attr('src')),
      });
    });
    return products;
  },
};
