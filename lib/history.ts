// Fiyat geçmişini grafik serilerine dönüştüren saf fonksiyonlar.

import type { SiteName } from './types';

export interface HistoryPoint {
  date: string;
  siteName: SiteName;
  price: number;
}

/** Grafik kütüphanelerinin beklediği geniş format: her satır bir gün, her site bir kolon. */
export type ChartRow = { date: string } & Partial<Record<SiteName, number>>;

export function buildChartRows(points: HistoryPoint[]): ChartRow[] {
  const byDate = new Map<string, ChartRow>();
  for (const p of [...points].sort((a, b) => a.date.localeCompare(b.date))) {
    const row = byDate.get(p.date) ?? { date: p.date };
    row[p.siteName] = p.price;
    byDate.set(p.date, row);
  }
  return [...byDate.values()];
}

/** Geçmişteki en düşük fiyatı ve gününü bulur ("tüm zamanların en ucuzu" vurgusu için). */
export function findLowestEver(points: HistoryPoint[]): HistoryPoint | null {
  let lowest: HistoryPoint | null = null;
  for (const p of points) {
    if (!lowest || p.price < lowest.price) lowest = p;
  }
  return lowest;
}
