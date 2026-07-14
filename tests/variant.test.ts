import { describe, expect, it } from 'vitest';
import {
  diceSimilarity,
  foldTurkish,
  isAccessoryTitle,
  parseProductTitle,
  variantLabel,
} from '../lib/variant';

describe('foldTurkish', () => {
  it('Türkçe karakterleri ASCII karşılığına indirger ve küçük harfe çevirir', () => {
    expect(foldTurkish('IŞIĞI Gümüş ÇÖL')).toBe('isigi gumus col');
    expect(foldTurkish('Kulaklık')).toBe('kulaklik');
  });

  it('noktalı I / noktasız ı ayrımını Türkçe kurala göre yapar', () => {
    expect(foldTurkish('DIŞ')).toBe('dis');
    expect(foldTurkish('İç')).toBe('ic');
  });
});

describe('parseProductTitle', () => {
  it('marka, model ve varyantı klasik telefon başlığından çıkarır', () => {
    const p = parseProductTitle('Apple iPhone 15 128 GB Mavi', { categorySlug: 'telefon' });
    expect(p.brand).toBe('Apple');
    expect(p.attrs.storageGb).toBe(128);
    expect(p.attrs.color).toBe('mavi');
    expect(p.isAccessory).toBe(false);
    expect(p.modelKey).toContain('iphone');
    expect(p.modelKey).toContain('15');
    // Varyant bilgisi model anahtarına sızmaz.
    expect(p.modelKey).not.toContain('mavi');
    expect(p.modelKey).not.toContain('128');
  });

  it('"4/128" biçimli birleşik RAM/depolama desenini çözer', () => {
    const p = parseProductTitle('Xiaomi Redmi Note 13 8/256 GB Siyah', { categorySlug: 'telefon' });
    expect(p.attrs.ramGb).toBe(8);
    expect(p.attrs.storageGb).toBe(256);
  });

  it('parantez içindeki kapasite/renk bilgisini de okur (Amazon tarzı)', () => {
    const p = parseProductTitle('Samsung Galaxy A07 (4GB RAM, 128GB Depolama) (MOR)', {
      categorySlug: 'telefon',
    });
    expect(p.brand).toBe('Samsung');
    expect(p.attrs.ramGb).toBe(4);
    expect(p.attrs.storageGb).toBe(128);
    expect(p.attrs.color).toBe('mor');
  });

  it('scraper yapılandırılmış alanı (attrHints) başlığa üstün gelir', () => {
    const p = parseProductTitle('Apple iPhone 15 128 GB Mavi', {
      categorySlug: 'telefon',
      attrHints: { color: 'siyah' },
    });
    expect(p.attrs.color).toBe('siyah');
  });

  it('aynı model farklı sıralı başlıklar aynı modelKey üretir', () => {
    const a = parseProductTitle('Apple iPhone 15 Pro Max 256 GB', { categorySlug: 'telefon' });
    const b = parseProductTitle('iPhone 15 Pro Max Apple 512 GB Siyah', { categorySlug: 'telefon' });
    expect(a.modelKey).toBe(b.modelKey);
  });
});

describe('isAccessoryTitle (kategoriye özel)', () => {
  it('telefon kategorisinde kılıf/şarj aksesuardır', () => {
    expect(isAccessoryTitle('telefon', foldTurkish('iPhone 15 uyumlu silikon kılıf'))).toBe(true);
    expect(isAccessoryTitle('telefon', foldTurkish('20W hızlı şarj aleti adaptör'))).toBe(true);
  });

  it('telefon kategorisinde kulaklık aksesuar, kulaklik kategorisinde ürünün kendisidir', () => {
    const title = foldTurkish('Bluetooth kablosuz kulaklık');
    expect(isAccessoryTitle('telefon', title)).toBe(true);
    expect(isAccessoryTitle('kulaklik', title)).toBe(false);
  });

  it('gerçek ürün başlığını aksesuar saymaz', () => {
    expect(isAccessoryTitle('telefon', foldTurkish('Samsung Galaxy S24 Ultra 512 GB'))).toBe(false);
  });
});

describe('diceSimilarity', () => {
  it('aynı anahtar 1, alakasız anahtar düşük skor verir', () => {
    expect(diceSimilarity('apple iphone 15', 'apple iphone 15')).toBe(1);
    expect(diceSimilarity('apple iphone 15', 'samsung galaxy s24')).toBeLessThan(0.3);
  });

  it('dolgu kelime farkı yüksek benzerlik bırakır', () => {
    const s = diceSimilarity('15 apple iphone', '15 apple iphone tr garantili');
    expect(s).toBeGreaterThan(0.7);
    expect(s).toBeLessThan(1);
  });
});

describe('variantLabel', () => {
  it('bilinen alanları " · " ile birleştirir, 1024 GB\'ı TB yazar', () => {
    expect(variantLabel({ storageGb: 1024, ramGb: 8, color: 'mavi' })).toContain('1 TB');
    expect(variantLabel({ storageGb: 128, ramGb: null, color: null })).toBe('128 GB');
  });
});
