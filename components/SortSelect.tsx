import CategoryChip from './ui/CategoryChip';
import { buildQuery, type SearchParamsRecord } from '@/lib/filters';
import type { CategorySort } from '@/lib/types';

/**
 * Kategori/arama sıralaması: Link tabanlı üç çip (JS'siz). Diğer tüm
 * parametreleri korur, sayfayı 1'e döndürür.
 */
const OPTIONS: { value: CategorySort; label: string }[] = [
  { value: 'popular', label: 'Popüler' },
  { value: 'price-asc', label: 'Ucuzdan pahalıya' },
  { value: 'price-desc', label: 'Pahalıdan ucuza' },
  { value: 'newest', label: 'En yeni' },
];

export default function SortSelect({
  basePath,
  searchParams,
  sort,
}: {
  basePath: string;
  searchParams: SearchParamsRecord;
  sort: CategorySort;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sıralama">
      {OPTIONS.map((opt) => (
        <CategoryChip
          key={opt.value}
          active={sort === opt.value}
          href={
            basePath +
            buildQuery(searchParams, (p) => {
              if (opt.value === 'popular') p.delete('sort'); // varsayılan: URL temiz kalsın
              else p.set('sort', opt.value);
            })
          }
        >
          {opt.label}
        </CategoryChip>
      ))}
    </div>
  );
}
