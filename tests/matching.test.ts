import { describe, expect, it } from 'vitest';
import {
  matchProduct,
  matchVariant,
  MATCH_THRESHOLDS,
  type CatalogProduct,
} from '../lib/matching';
import { CATEGORY_ATTRIBUTES } from '../lib/attributes';

function catalog(...products: CatalogProduct[]): Map<string, CatalogProduct> {
  return new Map(products.map((p) => [p.modelKey, p]));
}

const TELEFON_DEFS = CATEGORY_ATTRIBUTES.telefon;

describe('matchProduct', () => {
  it('modelKey birebir eşleşirse exact döner', () => {
    const p: CatalogProduct = { id: 1, brand: 'Apple', modelKey: '15 apple iphone', variants: [] };
    const m = matchProduct(catalog(p), { brand: 'Apple', modelKey: '15 apple iphone' });
    expect(m.kind).toBe('exact');
  });

  it('dolgu kelime farkını fuzzy köprüler (aynı marka, aynı ayırt ediciler)', () => {
    const p: CatalogProduct = {
      id: 1,
      brand: 'Xiaomi',
      modelKey: '13 note redmi xiaomi',
      variants: [],
    };
    const m = matchProduct(catalog(p), {
      brand: 'Xiaomi',
      modelKey: '13 cep note redmi telefonu xiaomi',
    });
    expect(m.kind === 'fuzzy' || m.kind === 'review').toBe(true);
    if (m.kind === 'fuzzy') expect(m.score).toBeGreaterThanOrEqual(MATCH_THRESHOLDS.autoAccept);
  });

  it('"Pro" ile "Pro+" ASLA fuzzy eşleşmez (ayırt edici token farkı)', () => {
    const p: CatalogProduct = {
      id: 1,
      brand: 'Xiaomi',
      modelKey: '15 note pro redmi xiaomi',
      variants: [],
    };
    const m = matchProduct(catalog(p), {
      brand: 'Xiaomi',
      modelKey: '15 note plus pro redmi xiaomi',
    });
    expect(m.kind).toBe('new');
  });

  it('farklı markalar asla fuzzy eşleşmez', () => {
    const p: CatalogProduct = { id: 1, brand: 'Samsung', modelKey: 'a55 galaxy samsung', variants: [] };
    const m = matchProduct(catalog(p), { brand: 'Xiaomi', modelKey: 'a55 galaxy xiaomi' });
    expect(m.kind).toBe('new');
  });

  it('marka bilinmiyorsa yüksek skor bile otomatik kabul edilmez, incelemeye düşer', () => {
    const p: CatalogProduct = { id: 1, brand: null, modelKey: '13 note redmi', variants: [] };
    const m = matchProduct(catalog(p), { brand: null, modelKey: '13 garantili note redmi' });
    expect(m.kind).toBe('review');
  });

  it('hiç aday yoksa new döner', () => {
    const m = matchProduct(catalog(), { brand: 'Apple', modelKey: '15 apple iphone' });
    expect(m.kind).toBe('new');
  });
});

describe('matchVariant (telefon nitelik kümesi: storage/ram fill, color strict)', () => {
  const product = (variants: CatalogProduct['variants']): CatalogProduct => ({
    id: 1,
    brand: 'Apple',
    modelKey: '15 apple iphone',
    variants,
  });

  it('RAM bilinmeyen kayıt tek uyumlu varyanta katılır ve RAM doldurulur', () => {
    const p = product([{ id: 10, attrs: { storage_gb: 128, ram_gb: 8, color: 'mavi' } }]);
    const m = matchVariant(TELEFON_DEFS, p, { storage_gb: 128, color: 'mavi' });
    expect(m.kind).toBe('reuse');
  });

  it('varyantta eksik RAM, gelen değerle backfill edilir', () => {
    const p = product([{ id: 10, attrs: { storage_gb: 128, color: 'mavi' } }]);
    const m = matchVariant(TELEFON_DEFS, p, { storage_gb: 128, ram_gb: 8, color: 'mavi' });
    expect(m.kind).toBe('reuse');
    if (m.kind === 'reuse') expect(m.fill.ram_gb).toBe(8);
  });

  it('rengi BİLİNMEYEN kayıt renkli varyantla birleşmez (strict) — yeni varyant açar', () => {
    const p = product([{ id: 10, attrs: { storage_gb: 128, ram_gb: 8, color: 'mavi' } }]);
    const m = matchVariant(TELEFON_DEFS, p, { storage_gb: 128, ram_gb: 8 });
    expect(m.kind).toBe('new');
  });

  it('farklı depolama farklı varyanttır', () => {
    const p = product([{ id: 10, attrs: { storage_gb: 128, ram_gb: 8, color: 'mavi' } }]);
    const m = matchVariant(TELEFON_DEFS, p, { storage_gb: 256, ram_gb: 8, color: 'mavi' });
    expect(m.kind).toBe('new');
  });

  it('çıplak temel renk ("mavi"), nitelenmiş gelenle ("sis-mavisi") uyuşur ve zenginleşir', () => {
    const p = product([{ id: 10, attrs: { storage_gb: 128, ram_gb: 8, color: 'mavi' } }]);
    const m = matchVariant(TELEFON_DEFS, p, { storage_gb: 128, ram_gb: 8, color: 'sis-mavisi' });
    expect(m.kind).toBe('reuse');
    if (m.kind === 'reuse') expect(m.fill.color).toBe('sis-mavisi');
  });

  it('birden çok uyumlu aday belirsizdir (sessiz birleştirme yok)', () => {
    const p = product([
      { id: 10, attrs: { storage_gb: 128, ram_gb: 8, color: 'mavi' } },
      { id: 11, attrs: { storage_gb: 128, ram_gb: 12, color: 'mavi' } },
    ]);
    // RAM bilinmiyor: iki adaya da uyar -> ambiguous
    const m = matchVariant(TELEFON_DEFS, p, { storage_gb: 128, color: 'mavi' });
    expect(m.kind).toBe('ambiguous');
  });
});
