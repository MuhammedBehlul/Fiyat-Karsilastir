import * as cheerio from 'cheerio';
import type { CategorySlug } from '../../lib/types';
import { parseTurkishPrice, pickImageUrl } from '../../lib/normalize';
import { canonicalColor, type VariantAttrs } from '../../lib/variant';
import { BlockedError, fetchHtml } from '../http';
import { fetchHtmlWithBrowser } from '../browser';
import type { ParsedItem, SiteScraper } from '../engine';

const BASE = 'https://www.n11.com';

/**
 * N11 listeleme başlıkları renk içermiyor; detay sayfası ise yapılandırılmış
 * "attributeList":[{"name":"Renk","value":"Koyu Mavi"},...] JSON'u taşıyor.
 * Başlıkta renk bulunamayan yeni ürünler için persist bu fonksiyona başvurur
 * (koşu başına sınırlı sayıda, istekler arası nazik gecikmeyle).
 */
async function fetchVariantDetails(url: string): Promise<Partial<VariantAttrs>> {
  let html: string;
  try {
    html = await fetchHtml(url);
  } catch (err) {
    // Listeleme gibi detay sayfaları da bot korumasına takılabiliyor —
    // aynı Playwright fallback'i burada da geçerli.
    if (!(err instanceof BlockedError)) throw err;
    const { ssrHtml, domHtml } = await fetchHtmlWithBrowser(url);
    html = ssrHtml.includes('"attributeList"') ? ssrHtml : domHtml;
  }
  const m = html.match(/"attributeList":(\[[^\]]*\])/);
  if (!m) return {};
  let list: { name: string; value: string }[];
  try {
    list = JSON.parse(m[1]);
  } catch {
    return {};
  }
  const attr = (n: string) => list.find((a) => a.name?.toLocaleLowerCase('tr-TR') === n)?.value;
  const out: Partial<VariantAttrs> = {};
  const renk = attr('renk');
  if (renk) out.color = canonicalColor(renk) ?? undefined;
  const hafiza = attr('dahili hafıza') ?? attr('dahili hafiza');
  const storage = hafiza?.match(/(\d+)\s*(gb|tb)/i);
  if (storage) out.storageGb = Number(storage[1]) * (storage[2].toLowerCase() === 'tb' ? 1024 : 1);
  const ramRaw = attr('ram') ?? attr('ram kapasitesi');
  const ram = ramRaw?.match(/(\d+)\s*gb/i);
  if (ram) out.ramGb = Number(ram[1]);
  return out;
}

// Sayfalama: ?pg=N (robots.txt engellemiyor).
const listing = (category: CategorySlug, path: string) => ({
  category,
  url: `${BASE}/${path}`,
  pageUrl: (page: number) => `${BASE}/${path}?pg=${page}`,
});

export const n11: SiteScraper = {
  site: 'n11',
  // Üst kategori linkleri bazen ürünsüz vitrin olabiliyor; buradaki yollar canlı
  // doğrulandı (hepsi a.product-item kartlarıyla ürün listeliyor).
  listings: [
    listing('telefon', 'telefon-ve-aksesuarlari/cep-telefonu'),
    listing('laptop', 'bilgisayar/dizustu-bilgisayar'),
    listing('kulaklik', 'telefon-ve-aksesuarlari/cep-telefonu-aksesuarlari/bluetooth-kulaklik'),
    listing('ev-aletleri', 'elektrikli-ev-aletleri'),
  ],
  waitForSelector: 'a.product-item',
  enrichDetail: fetchVariantDetails,
  parse(html) {
    const $ = cheerio.load(html);
    const products: ParsedItem[] = [];
    $('a.product-item').each((_, el) => {
      const card = $(el);
      const name = card.find('.product-item-title').first().text().trim();
      // Güncel fiyat h3.price-currency'de; .old-price üstü çizili eski fiyat.
      const price = parseTurkishPrice(card.find('.price-currency').first().text());
      const href = card.attr('href');
      if (!name || !href || Number.isNaN(price)) return;
      products.push({
        siteName: 'n11',
        name,
        price,
        currency: 'TRY',
        productUrl: href.startsWith('http') ? href.split('?')[0] : BASE + href.split('?')[0],
        imageUrl: pickImageUrl(card.find('img.listing-items-image').first().attr('src')),
      });
    });
    return products;
  },
};
