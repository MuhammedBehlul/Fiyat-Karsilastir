// Siteler arası ürün eşleştirme: bellek içi katalog üzerinde saf karar mantığı.
// DB işlemleri çağırana bırakılır (persist Prisma ile, backfill ham SQL ile yazar).
//
// Kural: iki kayıt ancak marka + model + varyant (depolama/RAM/renk) uyuşuyorsa
// aynı üründür. Model eşleşmesinde belirsizlik fuzzy eşiğiyle, varyant
// eşleşmesinde bilinmeyen alan kurallarıyla çözülür; emin olunamayan durumlar
// sessizce kabul edilmez, inceleme kaydına düşer.

import { colorBaseOf, diceSimilarity, isBareBaseColor } from './variant';
import type { AttributeDef, AttrValue, AttrValues } from './attributes';

export interface CatalogVariant {
  id: number;
  /** Bilinen nitelik değerleri (ProductVariant.attrs); bilinmeyen alan anahtarsız. */
  attrs: AttrValues;
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
  | { kind: 'reuse'; variant: CatalogVariant; fill: AttrValues }
  | { kind: 'new' }
  | { kind: 'ambiguous'; candidates: CatalogVariant[] };

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

/**
 * Tek nitelik uyumu, tanımın birleştirme kuralına göre:
 * - 'fill' : bilinmeyen (null) joker sayılır (eski kapasite kuralı).
 * - 'strict': bilinmeyen, değerliyle birleşmez (eski renk kuralı); renk
 *   türünde ayrıca temel-renk gruplaması uygulanır.
 */
function valueCompatible(def: AttributeDef, a: AttrValue | null, b: AttrValue | null): boolean {
  if (def.kind === 'color') return colorCompatible((a as string | null) ?? null, (b as string | null) ?? null);
  if (a === null && b === null) return true;
  if (a === null || b === null) return def.mergePolicy === 'fill';
  return a === b;
}

const valOf = (values: AttrValues, key: string): AttrValue | null => values[key] ?? null;

function strictlyEqual(defs: AttributeDef[], v: CatalogVariant, values: AttrValues): boolean {
  return defs.every((d) => valOf(v.attrs, d.key) === valOf(values, d.key));
}

/**
 * Ürün içinde gelen niteliklere uyan varyantı seçer (nitelik kümesi kategoriye
 * göre tanımlıdır — lib/attributes.ts).
 * - Tek uyumlu aday: yeniden kullan; adayın bilinmeyen alanlarını gelen
 *   değerlerle doldur (ör. "8/256" gören site RAM'i tamamlar).
 * - Birden çok aday: birebir eşit olan varsa o; yoksa belirsiz — çağıran kendi
 *   varyantını açar ve incelemeye yazar.
 * Tanımsız nitelik kümesi (kitap gibi) her kaydı tek varyanta düşürür.
 */
export function matchVariant(
  defs: AttributeDef[],
  product: CatalogProduct,
  values: AttrValues,
): VariantMatch {
  const candidates = product.variants.filter((v) =>
    defs.every((d) => valueCompatible(d, valOf(v.attrs, d.key), valOf(values, d.key))),
  );
  if (candidates.length === 0) return { kind: 'new' };

  const exact = candidates.filter((v) => strictlyEqual(defs, v, values));
  if (exact.length === 1) return { kind: 'reuse', variant: exact[0], fill: {} };
  if (candidates.length > 1) return { kind: 'ambiguous', candidates };

  const v = candidates[0];
  const fill: AttrValues = {};
  for (const d of defs) {
    const have = valOf(v.attrs, d.key);
    const incoming = valOf(values, d.key);
    if (incoming === null) continue;
    if (have === null) {
      fill[d.key] = incoming; // strict tanımda tek-taraflı null zaten aday olamazdı
    } else if (
      d.kind === 'color' &&
      have !== incoming &&
      isBareBaseColor(String(have)) &&
      !isBareBaseColor(String(incoming))
    ) {
      // Çıplak temel renk, nitelenmiş gelenle zenginleşir ("mavi" -> "sis-mavisi").
      fill[d.key] = incoming;
    }
  }
  return { kind: 'reuse', variant: v, fill };
}
