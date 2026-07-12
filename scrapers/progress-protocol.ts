// Alt süreç (scrapers/run.ts) ile onu tetikleyen admin sunucusu (scrapers/local-runner.ts)
// arasındaki tek iletişim kanalı stdout'tur. Yapılandırılmış ilerleme olayları
// düz metin logların arasına tek satırlık, sabit önekli JSON olarak basılır —
// ayrı bir IPC/socket kurmadan "hangi site, hangi kategori, kaçta kaç" bilgisini
// karşı tarafa taşır. GitHub Actions logunda da görünür ama zararsızdır (düz metin).
import type { CategorySlug, SiteName } from '../lib/types';

export const PROGRESS_PREFIX = '@@PROGRESS@@';

export type ProgressEvent =
  | { type: 'plan'; sites: { site: SiteName; categories: number }[] }
  | { type: 'site-start'; site: SiteName; index: number; total: number }
  | { type: 'site-done'; site: SiteName; productsFound: number; productsUpserted: number; error?: boolean }
  | {
      type: 'category';
      phase: 'start' | 'done';
      site: SiteName;
      category: CategorySlug;
      index: number;
      total: number;
      productsFound?: number;
      pagesFetched?: number;
    };

export type CategoryProgressEvent = Extract<ProgressEvent, { type: 'category' }>;

export function emitProgress(event: ProgressEvent): void {
  console.log(PROGRESS_PREFIX + JSON.stringify(event));
}

/** Bir stdout satırını ilerleme olayına çevirir; eşleşmiyorsa/bozuksa null. */
export function parseProgressLine(line: string): ProgressEvent | null {
  if (!line.startsWith(PROGRESS_PREFIX)) return null;
  try {
    return JSON.parse(line.slice(PROGRESS_PREFIX.length));
  } catch {
    return null;
  }
}
