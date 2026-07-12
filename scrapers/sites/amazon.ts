import * as cheerio from 'cheerio';
import { firstFromSrcSet, parseTurkishPrice, pickImageUrl } from '../../lib/normalize';
import type { ParsedItem, SiteScraper } from '../engine';

const BASE = 'https://www.amazon.com.tr';

export const amazon: SiteScraper = {
  site: 'amazon',
  // Kategori browse sayfaları; ürünler .octopus-pc-item kartlarında SSR geliyor.
  // Browse (/b?node=) sayfalarında klasik sayfalama yok — kategori başına tek sayfa.
  // Node id'leri Amazon'un kendi kategori ağacından/bestseller dizininden alındı.
  // Yeni node'lar sitenin üst navigasyonundan alındı ve canlı doğrulandı
  // (2026-07-12). Moda/kitap/kozmetik/süpermarket üst node'ları octopus kartı
  // olmayan vitrin sayfaları döndürüyor — o kategoriler Amazon'da kapsanmıyor.
  listings: [
    { category: 'telefon', url: `${BASE}/b?node=13709907031` },
    { category: 'laptop', url: `${BASE}/b?node=12601898031` },
    { category: 'kulaklik', url: `${BASE}/b?node=13710018031` },
    { category: 'ev-aletleri', url: `${BASE}/b?node=28201737031` },
    { category: 'ev-yasam', url: `${BASE}/b?node=12466668031` },
    { category: 'anne-bebek', url: `${BASE}/b?node=12466208031` },
    { category: 'spor-outdoor', url: `${BASE}/b?node=12467068031` },
    { category: 'oto-bahce-yapi', url: `${BASE}/b?node=12466724031` },
    { category: 'petshop', url: `${BASE}/b?node=20230635031` },
  ],
  waitForSelector: '.octopus-pc-item',
  parse(html) {
    const $ = cheerio.load(html);
    const products: ParsedItem[] = [];
    $('.octopus-pc-item').each((_, el) => {
      const card = $(el);
      // Genel '[class*="title"]' seçicisi puan bloğunu ("5 yıldız üzerinden 4,6 321")
      // başlığa yapıştırıyordu; önce asıl başlık sınıfı denenir, artık her koşulda kırpılır.
      const name = (
        card.find('.octopus-pc-asin-title').first().text().trim() ||
        card.find('[class*="title"]').first().text().trim()
      )
        .replace(/\s*\d*\s*(5 )?yıldız üzerinden[\s\S]*$/u, '')
        .trim();
      const price = parseTurkishPrice(card.find('.a-price .a-offscreen').first().text());
      const href = card.find('a[href*="/dp/"]').first().attr('href');
      if (!name || !href || Number.isNaN(price)) return;
      // /dp/ASIN kanonik biçimine indir; ref/takip parametrelerini taşıma.
      const asin = href.match(/\/dp\/([A-Z0-9]{10})/)?.[1];
      if (!asin) return;
      products.push({
        siteName: 'amazon',
        name,
        price,
        currency: 'TRY',
        productUrl: `${BASE}/dp/${asin}`,
        imageUrl: pickImageUrl(
          card.find('img').first().attr('src'),
          firstFromSrcSet(card.find('img').first().attr('srcset')),
        ),
      });
    });
    return products;
  },
};
