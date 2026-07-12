// Kategori başına varyant nitelik tanımları — TEK KAYNAK. Saf TypeScript,
// Next.js/Prisma importu yok.
//
// Varyant imzası artık sabit depolama/RAM/renk kolonları değil, kategoriye göre
// tanımlı bir nitelik kümesidir (ProductVariant.attrs JSONB). Bilinmeyen değer
// JSONB'ye hiç yazılmaz (anahtar yok); variantKey'de "?" ile temsil edilir.
//
// mergePolicy, lib/matching.ts'teki asimetrik kuralların genellemesidir:
// - 'fill'  : bilinmeyen değer, değeri bilinen varyanta katılabilir ve onu
//             tamamlar (mevcut depolama/RAM davranışı).
// - 'strict': bilinmeyen değer asla değerli varyanta birleştirilmez; kendi
//             "bilinmiyor" varyantında bekler (mevcut renk davranışı — beden
//             gibi nitelikler de bu sınıftadır).

import type { CategorySlug } from './types';
import { foldTurkish, type VariantAttrs } from './variant';

export type AttrValue = string | number;

/** Bir varyantın bilinen nitelik değerleri; bilinmeyen alan anahtarsızdır. */
export type AttrValues = Record<string, AttrValue>;

export type AttrKind =
  /** GB cinsinden kapasite (1024 -> "1 TB" gösterimi). */
  | 'gb'
  /** Birimli/birimsiz sayı (ml, g, adet...). */
  | 'number'
  /** Serbest ama kanonikleştirilmiş metin değeri (beden gibi). */
  | 'enum'
  /** lib/variant.ts renk sözlüğünden kanonik renk slug'ı; temel-renk
      gruplamalı uyum kuralı yalnızca bu türe uygulanır. */
  | 'color';

export interface AttributeDef {
  /** JSONB anahtarı ve filtre URL parametresi (İngilizce, snake_case). */
  key: string;
  /** Filtre paneli / varyant etiketi görünen adı (Türkçe). */
  label: string;
  kind: AttrKind;
  /** kind 'number' için görünen birim ("ml", "g"); değer birimsiz saklanır. */
  unit?: string;
  /** Facet/filtre panelinde seçenek olarak sunulur mu? */
  filterable: boolean;
  mergePolicy: 'fill' | 'strict';
}

const STORAGE: AttributeDef = { key: 'storage_gb', label: 'Depolama', kind: 'gb', filterable: true, mergePolicy: 'fill' };
const RAM: AttributeDef = { key: 'ram_gb', label: 'RAM', kind: 'gb', filterable: true, mergePolicy: 'fill' };
const COLOR: AttributeDef = { key: 'color', label: 'Renk', kind: 'color', filterable: true, mergePolicy: 'strict' };
const SIZE: AttributeDef = { key: 'size', label: 'Beden', kind: 'enum', filterable: true, mergePolicy: 'strict' };
const VOLUME_ML: AttributeDef = { key: 'volume_ml', label: 'Hacim', kind: 'number', unit: 'ml', filterable: true, mergePolicy: 'fill' };
const WEIGHT_G: AttributeDef = { key: 'weight_g', label: 'Ağırlık', kind: 'number', unit: 'g', filterable: true, mergePolicy: 'fill' };
const PACK_COUNT: AttributeDef = { key: 'pack_count', label: 'Paket Adedi', kind: 'number', filterable: true, mergePolicy: 'fill' };

/**
 * Kategori -> varyant imzasını oluşturan nitelikler. Boş liste geçerlidir:
 * kitap gibi kategorilerde ürün = tek varyanttır (variantKey sabit '' olur).
 * Yeni kategorilerin ayrıştırıcıları Faz 3/4'te geldikçe değer üretilir;
 * o güne kadar tanımlar imza şemasını sabitler.
 */
export const CATEGORY_ATTRIBUTES: Record<CategorySlug, AttributeDef[]> = {
  telefon: [STORAGE, RAM, COLOR],
  laptop: [STORAGE, RAM, COLOR],
  kulaklik: [STORAGE, RAM, COLOR],
  'ev-aletleri': [STORAGE, RAM, COLOR],
  'ev-yasam': [COLOR],
  'anne-bebek': [SIZE, COLOR, PACK_COUNT],
  moda: [SIZE, COLOR],
  'kitap-muzik-hobi': [],
  'spor-outdoor': [SIZE, COLOR],
  kozmetik: [VOLUME_ML, COLOR, PACK_COUNT],
  'oto-bahce-yapi': [COLOR],
  petshop: [WEIGHT_G, PACK_COUNT],
  supermarket: [VOLUME_ML, WEIGHT_G, PACK_COUNT],
};

/**
 * Deterministik varyant imzası: kategorinin tanımlı nitelikleri anahtar
 * sırasına (alfabetik) dizilir, bilinmeyen değer "?" olur.
 * Ör. telefon: "color=mavi|ram_gb=8|storage_gb=128", kitap: "".
 * DB'deki mevcut anahtarlar migration'da aynı biçime yeniden yazıldı —
 * biçim değişirse migration da birlikte değişmelidir.
 */
export function variantKeyFor(categorySlug: CategorySlug, values: AttrValues): string {
  return [...CATEGORY_ATTRIBUTES[categorySlug]]
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .map((d) => `${d.key}=${values[d.key] ?? '?'}`)
    .join('|');
}

/**
 * Arama anahtarı: modelKey token'ları + nitelik değer token'ları, alfabetik
 * (lib/variant.ts'teki eski searchKeyOf'un genel karşılığı — elektronik
 * kategorilerinde birebir aynı çıktıyı üretir).
 */
export function searchKeyFor(modelKey: string, values: AttrValues): string {
  const tokens = new Set(modelKey.split(' ').filter(Boolean));
  for (const v of Object.values(values)) {
    if (typeof v === 'number') tokens.add(String(v));
    else for (const t of v.split('-')) tokens.add(t);
  }
  return [...tokens].sort().join(' ');
}

// ---------------------------------------------------------------------------
// Başlıktan nitelik çıkarımı (hacim / ağırlık / paket adedi)
// ---------------------------------------------------------------------------

/** Ondalık virgül noktaya çevrilir, gerisi boşluğa katlanır ("2,5 Kg" -> "2.5 kg"). */
function foldForAttrs(title: string): string {
  return foldTurkish(title)
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/[^a-z0-9.]+/g, ' ');
}

const toMl = (v: number, unit: string) => Math.round(unit === 'ml' ? v : unit === 'cl' ? v * 10 : v * 1000);
const toG = (v: number, unit: string) => Math.round(unit.startsWith('k') ? v * 1000 : v);

const VOL_UNIT = '(ml|cl|lt|litre|l)';
const WEIGHT_UNIT = '(kg|gram|gr|g)';

/**
 * Kategorinin tanımlı nitelikleri için başlıktan değer çıkarır. Yalnızca
 * tanımlı anahtarlar yazılır ("6 x 1 L" süpermarkette paket+hacim üretir,
 * moda kategorisinde hiç bakılmaz). Depolama/RAM/renk burada DEĞİL —
 * onlar parseProductTitle'dan gelir (bkz. buildAttrValues).
 */
export function extractAttrValues(categorySlug: CategorySlug, title: string): AttrValues {
  const defs = CATEGORY_ATTRIBUTES[categorySlug];
  const keys = new Set(defs.map((d) => d.key));
  const values: AttrValues = {};
  if (!keys.has('volume_ml') && !keys.has('weight_g') && !keys.has('pack_count')) return values;
  const s = foldForAttrs(title);

  // Çoklu paket kalıbı: "6 x 1 l", "4x500 ml", "2 x 2.5 kg" — paket + birim değer.
  if (keys.has('volume_ml')) {
    const combo = s.match(new RegExp(`\\b(\\d+)\\s*x\\s*(\\d+(?:\\.\\d+)?)\\s*${VOL_UNIT}\\b`));
    if (combo) {
      if (keys.has('pack_count')) values.pack_count = Number(combo[1]);
      values.volume_ml = toMl(Number(combo[2]), combo[3]);
    } else {
      const single = s.match(new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s*${VOL_UNIT}\\b`));
      if (single) values.volume_ml = toMl(Number(single[1]), single[2]);
    }
  }
  if (keys.has('weight_g') && values.volume_ml === undefined) {
    const combo = s.match(new RegExp(`\\b(\\d+)\\s*x\\s*(\\d+(?:\\.\\d+)?)\\s*${WEIGHT_UNIT}\\b`));
    if (combo) {
      if (keys.has('pack_count')) values.pack_count = Number(combo[1]);
      values.weight_g = toG(Number(combo[2]), combo[3]);
    } else {
      const single = s.match(new RegExp(`\\b(\\d+(?:\\.\\d+)?)\\s*${WEIGHT_UNIT}\\b`));
      if (single) values.weight_g = toG(Number(single[1]), single[2]);
    }
  }
  if (keys.has('pack_count') && values.pack_count === undefined) {
    // "60 li" ("60'lı"), "12 adet", "deodorant x2" — makul aralık dışını alma.
    const m =
      s.match(/\b(\d+)\s*(?:li|lu)\b/) ?? s.match(/\b(\d+)\s*adet\b/) ?? s.match(/\bx(\d+)\b/);
    const n = m ? Number(m[1]) : NaN;
    if (Number.isInteger(n) && n >= 2 && n <= 500) values.pack_count = n;
  }
  return values;
}

/**
 * Bir kaydın tam nitelik kümesi: başlık çıkarımı + parseProductTitle'ın
 * depolama/RAM/renk sonuçları — yalnızca kategorinin TANIMLI anahtarları yazılır.
 */
export function buildAttrValues(
  categorySlug: CategorySlug,
  attrs: VariantAttrs,
  title: string,
): AttrValues {
  const defs = CATEGORY_ATTRIBUTES[categorySlug];
  const values = extractAttrValues(categorySlug, title);
  for (const d of defs) {
    if (d.key === 'storage_gb' && attrs.storageGb != null) values.storage_gb = attrs.storageGb;
    else if (d.key === 'ram_gb' && attrs.ramGb != null) values.ram_gb = attrs.ramGb;
    else if (d.key === 'color' && attrs.color != null) values.color = attrs.color;
  }
  return values;
}
