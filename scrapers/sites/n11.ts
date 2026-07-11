import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { CategorySlug } from '../../lib/types';
import { parseTurkishPrice, pickImageUrl } from '../../lib/normalize';
import { canonicalColor } from '../../lib/variant';
import { BlockedError, fetchHtml } from '../http';
import { fetchHtmlWithBrowser } from '../browser';
import type { DetailInfo, ParsedItem, SiteScraper } from '../engine';

const BASE = 'https://www.n11.com';

/**
 * N11 listeleme başlıkları renk içermiyor; detay sayfası ise yapılandırılmış
 * "catalogProductInfo":{"attributeList":[{"name":"Renk",...}],"imageUrl":"..."}
 * JSON'u taşıyor. Başlıkta renk bulunamayan yeni ürünler için persist bu
 * fonksiyona başvurur (koşu başına sınırlı sayıda, nazik gecikmeyle) — aynı
 * yanıttan ürün görseli de bedavaya çıkar (listelemede lazy-load yüzünden
 * görselsiz kalan N11 kayıtlarını doldurur).
 */
async function fetchVariantDetails(url: string): Promise<DetailInfo> {
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
  const out: DetailInfo = {};
  const renk = attr('renk');
  if (renk) out.color = canonicalColor(renk) ?? undefined;
  const hafiza = attr('dahili hafıza') ?? attr('dahili hafiza');
  const storage = hafiza?.match(/(\d+)\s*(gb|tb)/i);
  if (storage) out.storageGb = Number(storage[1]) * (storage[2].toLowerCase() === 'tb' ? 1024 : 1);
  const ramRaw = attr('ram') ?? attr('ram kapasitesi');
  const ram = ramRaw?.match(/(\d+)\s*gb/i);
  if (ram) out.ramGb = Number(ram[1]);
  // attributeList'in hemen ardındaki imageUrl aynı catalogProductInfo bloğundandır.
  const img = html.slice(m.index!, m.index! + m[0].length + 500).match(/"imageUrl":"([^"]+)"/);
  out.imageUrl = pickImageUrl(img?.[1]);
  return out;
}

/**
 * Karttaki tüm img'lerden ürün fotoğrafı adaylarını toplar: kampanya kareleri
 * (square-size / alt="SQUARE") ve ikon img'leri atlanır; lazy-load gerçek URL'i
 * data-src/data-original'da tuttuğu için onlar src'den önce denenir.
 */
function imageCandidates(
  card: cheerio.Cheerio<AnyNode>,
  $: cheerio.CheerioAPI,
): (string | undefined)[] {
  const lazy: (string | undefined)[] = [];
  const direct: (string | undefined)[] = [];
  card.find('img').each((_, el) => {
    const img = $(el);
    const cls = img.attr('class') ?? '';
    if (/square-size|card-add-button|badge/.test(cls) || img.attr('alt') === 'SQUARE') return;
    lazy.push(img.attr('data-original'), img.attr('data-src'));
    direct.push(img.attr('src'));
  });
  return [...lazy, ...direct];
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
        // Gerçek görsel URL'i çoğu kartta listing-items-image'ın KARDEŞİ olan
        // bir img'in data-src'sinde (canlı DOM incelemesiyle doğrulandı);
        // kampanya kareleri (.square-size, alt="SQUARE") ve buton ikonları elenir.
        imageUrl: pickImageUrl(...imageCandidates(card, $)),
      });
    });
    return products;
  },
};
