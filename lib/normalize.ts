// Fiyat ve ürün adı normalizasyonu — saf fonksiyonlar, dış bağımlılık yok.

/**
 * Türkçe biçimli fiyat metnini sayıya çevirir.
 * Örnekler: "8.399 TL" -> 8399, "129.349,00 TL" -> 129349, "47.899" -> 47899, "199 TL" -> 199
 * Fiyat bulunamazsa NaN döner.
 */
export function parseTurkishPrice(text: string): number {
  const match = text.replace(/\s+/g, ' ').match(/(\d{1,3}(?:\.\d{3})*|\d+)(,\d{1,2})?/);
  if (!match) return NaN;
  const whole = match[1].replace(/\./g, '');
  const frac = match[2] ? match[2].replace(',', '.') : '';
  return Number(whole + frac);
}

// Not: ürün adı -> eşleştirme anahtarı üretimi lib/variant.ts'e taşındı
// (parseProductTitle): marka+model anahtarının yanında varyant imzası da üretir.

/** Fiyat görüntüleme yardımcıları (UI'da da kullanılır, saf TS). */
export function formatPrice(price: number, currency = 'TRY'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

/**
 * Bazı sitelerin ürün görseli <img>'inde `onerror="this.src='.../no-image.svg'"` gibi
 * bir fallback tanımlı oluyor; gerçek görsel CDN'de anlık başarısız olursa tarayıcı
 * bu fallback'e geçiyor ve scraper HTML'i o anda yakaladığında "görsel yok" ikonunu
 * gerçek ürün fotoğrafıymış gibi kaydediyor. Bilinen bu tür sabit URL'ler elenir.
 */
const KNOWN_NO_IMAGE_URLS = new Set([
  'https://n11scdn.akamaized.net/custom/upload/72/02/5877938217780004029.svg',
]);

/**
 * Scraper'ların yakaladığı görsel adaylarından ilk geçerli olanı seçer.
 * Lazy-load'lu sitelerde `src` bazen henüz gerçek görsele dönüşmemiş bir
 * placeholder (data: URI SVG iskeleti) taşıyor — bunu ürün görseli diye
 * kaydetmemek için eleniyor, `data-src`/`data-original` gibi adaylar önce denenir.
 */
export function pickImageUrl(...candidates: (string | undefined)[]): string | undefined {
  for (const c of candidates) {
    if (!c) continue;
    if (c.startsWith('data:')) continue;
    if (/placeholder/i.test(c)) continue;
    if (KNOWN_NO_IMAGE_URLS.has(c)) continue;
    return c;
  }
  return undefined;
}

export interface Savings {
  amount: number;
  percent: number;
}

/** En ucuz ile en pahalı site fiyatı arasındaki farkı hesaplar ("X ₺ tasarruf" vurgusu için). */
export function calcSavings(cheapest: number, mostExpensive: number): Savings | null {
  if (!(mostExpensive > cheapest)) return null;
  const amount = mostExpensive - cheapest;
  return { amount, percent: (amount / mostExpensive) * 100 };
}

/** Ürünleri en ucuz fiyatlarına göre sıralar (prices dizisi zaten ucuzdan pahalıya gelir). */
export function sortByCheapestPrice<T extends { prices: { price: number }[] }>(
  products: T[],
  direction: 'asc' | 'desc' = 'asc',
): T[] {
  const sorted = [...products].sort(
    (a, b) => (a.prices[0]?.price ?? Infinity) - (b.prices[0]?.price ?? Infinity),
  );
  return direction === 'desc' ? sorted.reverse() : sorted;
}
