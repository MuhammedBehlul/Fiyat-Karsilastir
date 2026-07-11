import Link from 'next/link';
import { buildQuery, type SearchParamsRecord } from '@/lib/filters';
import { cx } from './cx';

/**
 * Numaralı sayfalama: tamamen Link tabanlı (JS'siz çalışır), mevcut filtre/sıralama
 * parametrelerini korur. Pencereli görünüm: 1 … 4 [5] 6 … 20.
 */
export default function Pagination({
  basePath,
  searchParams,
  page,
  totalPages,
}: {
  basePath: string;
  searchParams: SearchParamsRecord;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (n: number) =>
    basePath +
    buildQuery(
      searchParams,
      (p) => {
        if (n <= 1) p.delete('page');
        else p.set('page', String(n));
      },
      { resetPage: false },
    );

  // Pencere: ilk, son, geçerli±1; aradaki boşluklara tek '…'.
  const wanted = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const numbers = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const items: (number | '…')[] = [];
  for (const [i, n] of numbers.entries()) {
    if (i > 0 && n - numbers[i - 1] > 1) items.push('…');
    items.push(n);
  }

  const linkBase =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-body-sm font-medium transition-colors';

  return (
    <nav aria-label="Sayfalama" className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className={cx(linkBase, 'border-border bg-surface text-text hover:border-primary hover:text-primary')}>
          ‹ Önceki
        </Link>
      )}
      {items.map((item, i) =>
        item === '…' ? (
          <span key={`gap-${i}`} className="px-1.5 text-body-sm text-muted" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cx(
              linkBase,
              item === page
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-surface text-text hover:border-primary hover:text-primary',
            )}
          >
            {item}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} rel="next" className={cx(linkBase, 'border-border bg-surface text-text hover:border-primary hover:text-primary')}>
          Sonraki ›
        </Link>
      )}
    </nav>
  );
}
