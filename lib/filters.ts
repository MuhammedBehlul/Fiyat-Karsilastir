// Kategori filtrelerinin URL parametre şeması — saf TS, hem sunucu (sayfa)
// hem istemci (CategoryFilters) aynı ayrıştırma/serileştirmeyi kullanır.
//
// Şema: ?brand=Apple,Samsung&storage=128,256&ram=8&color=siyah,mavi
//        &min=5000&max=40000&comparable=1&sort=price-asc&page=2
// Çok değerli filtreler tek parametrede virgülle birleşir. Filtre/sıralama
// değişince page her zaman 1'e döner (yalnızca sayfalama page yazar).

import type { CategoryFilters, CategorySort } from './types';

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** Next searchParams değeri string[] gelebilir (tekrarlı parametre); ilkini al. */
function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function list(v: string | string[] | undefined): string[] | undefined {
  const s = first(v);
  const arr = s ? s.split(',').filter(Boolean) : [];
  return arr.length > 0 ? arr : undefined;
}

function numList(v: string | string[] | undefined): number[] | undefined {
  const arr = (list(v) ?? []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  return arr.length > 0 ? arr : undefined;
}

function positiveNum(v: string | string[] | undefined): number | undefined {
  const n = Number(first(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function parseFilters(sp: SearchParamsRecord): CategoryFilters {
  return {
    brand: list(sp.brand),
    storageGb: numList(sp.storage),
    ramGb: numList(sp.ram),
    color: list(sp.color),
    minPrice: positiveNum(sp.min),
    maxPrice: positiveNum(sp.max),
    comparableOnly: first(sp.comparable) === '1' ? true : undefined,
  };
}

export function parseSort(sp: SearchParamsRecord): CategorySort {
  const s = first(sp.sort);
  return s === 'price-desc' || s === 'newest' ? s : 'price-asc';
}

export function parsePage(sp: SearchParamsRecord): number {
  const n = Number(first(sp.page));
  return Number.isInteger(n) && n > 1 ? n : 1;
}

export function hasActiveFilters(filters: CategoryFilters): boolean {
  return Boolean(
    filters.brand ||
      filters.storageGb ||
      filters.ramGb ||
      filters.color ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.comparableOnly,
  );
}

/** Aktif filtre sayısı (mobil "Filtrele" düğmesindeki rozet için). */
export function countActiveFilters(filters: CategoryFilters): number {
  return (
    (filters.brand?.length ?? 0) +
    (filters.storageGb?.length ?? 0) +
    (filters.ramGb?.length ?? 0) +
    (filters.color?.length ?? 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.comparableOnly ? 1 : 0)
  );
}

/**
 * Mevcut parametrelerden yeni bir sorgu dizesi üretir: `mutate` içinde
 * parametre ekle/çıkar; page otomatik sıfırlanır (sayfalama hariç her
 * değişiklik 1. sayfaya döner). Dönen değer '' ya da '?...' biçimindedir.
 */
export function buildQuery(
  sp: SearchParamsRecord,
  mutate: (p: URLSearchParams) => void,
  opts: { resetPage?: boolean } = { resetPage: true },
): string {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const v = first(value);
    if (v != null && v !== '') p.set(key, v);
  }
  mutate(p);
  if (opts.resetPage !== false) p.delete('page');
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

/** Çok değerli bir filtre parametresinden tek değeri düşürür (aktif çipin çarpısı). */
export function removeListValue(p: URLSearchParams, key: string, value: string): void {
  const next = (p.get(key) ?? '').split(',').filter((v) => v && v !== value);
  if (next.length > 0) p.set(key, next.join(','));
  else p.delete(key);
}

/**
 * Kanonik renk slug'ları katlanmış ASCII'dir ("gok-mavisi") — görünen ad için
 * kelime bazında Türkçe karşılık sözlüğü kullanılır; bilinmeyen kelime yalnızca
 * baş harfi büyütülür.
 */
const COLOR_WORDS: Record<string, string> = {
  siyah: 'Siyah', siyahi: 'Siyahı', beyaz: 'Beyaz', beyazi: 'Beyazı',
  mavi: 'Mavi', mavisi: 'Mavisi', kirmizi: 'Kırmızı', yesil: 'Yeşil',
  sari: 'Sarı', mor: 'Mor', pembe: 'Pembe', turuncu: 'Turuncu',
  gri: 'Gri', grisi: 'Grisi', gumus: 'Gümüş', altin: 'Altın',
  lacivert: 'Lacivert', kahverengi: 'Kahverengi', bej: 'Bej', krem: 'Krem',
  bordo: 'Bordo', bronz: 'Bronz', sampanya: 'Şampanya', titanyum: 'Titanyum',
  titanyumu: 'Titanyumu', grafit: 'Grafit', antrasit: 'Antrasit', lila: 'Lila',
  eflatun: 'Eflatun', lavanta: 'Lavanta', nane: 'Nane', turkuaz: 'Turkuaz',
  gece: 'Gece', yarisi: 'Yarısı', fantom: 'Fantom', uzay: 'Uzay',
  oniks: 'Oniks', yildiz: 'Yıldız', isigi: 'Işığı', buz: 'Buz',
  gok: 'Gök', sis: 'Sis', koyu: 'Koyu', acik: 'Açık',
  ada: 'Ada', cayi: 'Çayı', kozmik: 'Kozmik', roze: 'Roze',
  natural: 'Natural', col: 'Çöl', kobalt: 'Kobalt', safir: 'Safir',
  mercan: 'Mercan', mat: 'Mat', parlak: 'Parlak', metalik: 'Metalik',
  pastel: 'Pastel',
};

/** Kanonik renk slug'ını görünen ada çevirir: "gok-mavisi" -> "Gök Mavisi". */
export function colorLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => COLOR_WORDS[w] ?? w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1))
    .join(' ');
}

/** Kapasite etiketi: 1024 -> "1 TB", 128 -> "128 GB". */
export function capacityLabel(gb: number): string {
  return gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`;
}