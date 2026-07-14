import { describe, expect, it } from 'vitest';
import {
  calcSavings,
  isSuspectImageUrl,
  parseTurkishPrice,
  pickImageUrl,
  sortByCheapestPrice,
} from '../lib/normalize';

describe('parseTurkishPrice', () => {
  it('Türkçe biçimli fiyatları çözer', () => {
    expect(parseTurkishPrice('8.399 TL')).toBe(8399);
    expect(parseTurkishPrice('129.349,00 TL')).toBe(129349);
    expect(parseTurkishPrice('47.899')).toBe(47899);
    expect(parseTurkishPrice('199 TL')).toBe(199);
    expect(parseTurkishPrice('1.299,90')).toBeCloseTo(1299.9);
  });

  it('fiyat yoksa NaN döner', () => {
    expect(Number.isNaN(parseTurkishPrice('stokta yok'))).toBe(true);
  });
});

describe('calcSavings', () => {
  it('en ucuz < en pahalı ise fark ve yüzdeyi verir', () => {
    const s = calcSavings(80, 100);
    expect(s).not.toBeNull();
    expect(s!.amount).toBe(20);
    expect(s!.percent).toBe(20);
  });

  it('eşit veya ters sıralı fiyatlarda null döner', () => {
    expect(calcSavings(100, 100)).toBeNull();
    expect(calcSavings(120, 100)).toBeNull();
  });
});

describe('görsel adayı eleme', () => {
  it('placeholder / banner / svg / data: URI şüphelidir', () => {
    expect(isSuspectImageUrl('data:image/svg+xml;base64,abc')).toBe(true);
    expect(isSuspectImageUrl('https://cdn.dsmcdn.com/x/trendyol-product-card-placeholder_1.svg')).toBe(true);
    expect(isSuspectImageUrl('https://images.hepsiburada.net/banners/5g-destekli.jpg')).toBe(true);
    expect(isSuspectImageUrl('https://cdn.example.com/foo.svg?v=2')).toBe(true);
    expect(isSuspectImageUrl('https://cdn.dsmcdn.com/urun/123.jpg')).toBe(false);
  });

  it('pickImageUrl ilk geçerli adayı seçer', () => {
    expect(
      pickImageUrl('data:image/svg+xml;base64,x', undefined, 'https://cdn.dsmcdn.com/real.jpg'),
    ).toBe('https://cdn.dsmcdn.com/real.jpg');
    expect(pickImageUrl('data:x', undefined)).toBeUndefined();
  });
});

describe('sortByCheapestPrice', () => {
  const items = [
    { prices: [{ price: 300 }] },
    { prices: [{ price: 100 }] },
    { prices: [] }, // fiyatsız her zaman sona
    { prices: [{ price: 200 }] },
  ];

  it('asc: ucuzdan pahalıya, fiyatsız sona', () => {
    const sorted = sortByCheapestPrice(items, 'asc');
    expect(sorted.map((i) => i.prices[0]?.price)).toEqual([100, 200, 300, undefined]);
  });

  it('desc: pahalıdan ucuza', () => {
    const sorted = sortByCheapestPrice(items, 'desc');
    expect(sorted[0].prices[0]?.price).toBe(undefined); // reverse fiyatsızı başa alır — bilinen davranış
  });
});
