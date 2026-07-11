// Siteler arası ürün eşleştirme: bellek içi katalog üzerinde saf karar mantığı.
// DB işlemleri çağırana bırakılır (persist Prisma ile, backfill ham SQL ile yazar).
//
// Kural: iki kayıt ancak marka + model + varyant (depolama/RAM/renk) uyuşuyorsa
// aynı üründür. Model eşleşmesinde belirsizlik fuzzy eşiğiyle, varyant
// eşleşmesinde bilinmeyen alan kurallarıyla çözülür; emin olunamayan durumlar
// sessizce kabul edilmez, inceleme kaydına düşer.

import {
  colorBaseOf,
  diceSimilarity,
  isBareBaseColor,
  type VariantAttrs,
} from './variant';

export interface CatalogVariant {
  id: number;
  storageGb: number | null;
  ramGb: number | null;
  color: string | null;
}

export interface CatalogProduct {
  id: number;
  brand: string | null;
  modelKey: string;
  variants: CatalogVariant[];
}

/** Fuzzy model eşleştirme eşikleri. */
export const MATCH_THRESHOLDS = {
  /** Bu skorun üstü otomatik kabul edilir. */
  autoAccept: 0.9,
  /** Bu skor ile autoAccept arası incelemeye düşer; altı yeni ürün sayılır. */
  review: 0.75,
};

export type ProductMatch =
  | { kind: 'exact'; product: CatalogProduct }
  | { kind: 'fuzzy'; product: CatalogProduct; score: number }
  | { kind: 'review'; product: CatalogProduct; score: number }
  | { kind: 'new' };

/**
 * Model ayırt edici token'ları: sayı içerenler ("15", "a07", "15c") ve bilinen
 * seri son ekleri. "Note 15 Pro+" ile "Note 15 Pro" Dice'ta 0.91 benzer ama
 * FARKLI telefonlardır — fuzzy eşleşme bu token kümesi birebir aynı değilse
 * adaya hiç bakmaz; benzerlik yalnızca dolgu kelimelerdeki farkları köprüler.
 */
const MODEL_DIFFERENTIATORS = new Set([
  'plus', 'pro', 'max', 'ultra', 'mini', 'lite', 'fe', 'se', 'air', 'neo',
  'gt', 'fold', 'flip', 'active', 'prime', 'play', 'yenilenmis',
]);

function differentiatorsOf(modelKey: string): string {
  return modelKey
    .split(' ')
    .filter((t) => /\d/.test(t) || MODEL_DIFFERENTIATORS.has(t))
    .sort()
    .join('|');
}

/**
 * Model düzeyinde eşleştirme: önce modelKey tam eşleşmesi, sonra aynı marka
 * içinde token-küme Dice benzerliği. Marka bilinmiyorsa fuzzy tüm kataloğa
 * bakar ama yalnızca inceleme eşiğinde döner (otomatik kabul edilmez).
 */
export function matchProduct(
  byModelKey: Map<string, CatalogProduct>,
  parsed: { brand: string | null; modelKey: string },
  thresholds = MATCH_THRESHOLDS,
): ProductMatch {
  const exact = byModelKey.get(parsed.modelKey);
  if (exact) return { kind: 'exact', product: exact };

  let best: CatalogProduct | null = null;
  let bestScore = 0;
  const parsedDiff = differentiatorsOf(parsed.modelKey);
  for (const p of byModelKey.values()) {
    // Marka asla fuzzy eşleşmez: ikisi de biliniyorsa aynı olmalı.
    if (parsed.brand && p.brand && parsed.brand !== p.brand) continue;
    // Ayırt edici token'lar (model no, Pro/Plus/Max...) birebir aynı olmalı.
    if (differentiatorsOf(p.modelKey) !== parsedDiff) continue;
    const score = diceSimilarity(parsed.modelKey, p.modelKey);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  if (!best || bestScore < thresholds.review) return { kind: 'new' };
  const brandKnown = Boolean(parsed.brand && best.brand);
  if (bestScore >= thresholds.autoAccept && brandKnown)
    return { kind: 'fuzzy', product: best, score: bestScore };
  return { kind: 'review', product: best, score: bestScore };
}

// ---------------------------------------------------------------------------
// Varyant eşleştirme
// ---------------------------------------------------------------------------

export type VariantMatch =
  | { kind: 'reuse'; variant: CatalogVariant; fill: Partial<VariantAttrs> }
  | { kind: 'new' }
  | { kind: 'ambiguous'; candidates: CatalogVariant[] };

/** İki kapasite değeri uyumlu mu? Bilinmeyen (null) joker sayılır. */
function capacityCompatible(a: number | null, b: number | null): boolean {
  return a === null || b === null || a === b;
}

/**
 * Renk uyumu: eşitse ya da biri çıplak temel renk ("mavi") diğeri aynı temelin
 * nitelenmiş hali ("sis-mavisi") ise uyumludur. Renk BİLİNMEYEN kayıt renkli
 * kayıtla birleştirilmez (iPhone 15'in 5 rengi var; dünkü tahmin yarın yanlış
 * çıkar) — kendi "renk bilinmiyor" varyantını açar.
 */
function colorCompatible(a: string | null, b: string | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a === b) return true;
  const baseA = colorBaseOf(a);
  const baseB = colorBaseOf(b);
  return baseA !== null && baseA === baseB && (isBareBaseColor(a) || isBareBaseColor(b));
}

function strictlyEqual(v: CatalogVariant, a: VariantAttrs): boolean {
  return v.storageGb === a.storageGb && v.ramGb === a.ramGb && v.color === a.color;
}

/**
 * Ürün içinde gelen niteliklere uyan varyantı seçer.
 * - Tek uyumlu aday: yeniden kullan; adayın bilinmeyen alanlarını gelen
 *   değerlerle doldur (ör. "8/256" gören site RAM'i tamamlar).
 * - Birden çok aday: birebir eşit olan varsa o; yoksa belirsiz — çağıran kendi
 *   varyantını açar ve incelemeye yazar.
 */
export function matchVariant(product: CatalogProduct, attrs: VariantAttrs): VariantMatch {
  const candidates = product.variants.filter(
    (v) =>
      capacityCompatible(v.storageGb, attrs.storageGb) &&
      capacityCompatible(v.ramGb, attrs.ramGb) &&
      colorCompatible(v.color, attrs.color),
  );
  if (candidates.length === 0) return { kind: 'new' };

  const exact = candidates.filter((v) => strictlyEqual(v, attrs));
  if (exact.length === 1) return { kind: 'reuse', variant: exact[0], fill: {} };
  if (candidates.length > 1) return { kind: 'ambiguous', candidates };

  const v = candidates[0];
  const fill: Partial<VariantAttrs> = {};
  if (v.storageGb === null && attrs.storageGb !== null) fill.storageGb = attrs.storageGb;
  if (v.ramGb === null && attrs.ramGb !== null) fill.ramGb = attrs.ramGb;
  // Çıplak temel renk, nitelenmiş gelenle zenginleşir ("mavi" -> "sis-mavisi").
  if (v.color !== null && attrs.color !== null && v.color !== attrs.color && isBareBaseColor(v.color) && !isBareBaseColor(attrs.color))
    fill.color = attrs.color;
  return { kind: 'reuse', variant: v, fill };
}
