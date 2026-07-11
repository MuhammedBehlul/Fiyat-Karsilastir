import CategoryChip from './ui/CategoryChip';

// JS'siz sıralama: query string'e sort=asc|desc ekleyen düz linkler,
// CategoryChip'in aktif/pasif pill görünümü yeniden kullanılır.
export default function SortToggle({
  basePath,
  query,
  sort,
}: {
  basePath: string;
  query?: string;
  sort?: string;
}) {
  const hrefFor = (s?: 'asc' | 'desc') => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (s) params.set('sort', s);
    return `${basePath}?${params.toString()}`;
  };

  const currentSort = sort === 'asc' || sort === 'desc' ? sort : 'rel';

  return (
    <div className="flex items-center gap-2 text-body-sm">
      <span className="text-muted">Sırala:</span>
      <CategoryChip href={hrefFor()} active={currentSort === 'rel'}>
        En ilişkili
      </CategoryChip>
      <CategoryChip href={hrefFor('asc')} active={currentSort === 'asc'}>
        Ucuzdan pahalıya
      </CategoryChip>
      <CategoryChip href={hrefFor('desc')} active={currentSort === 'desc'}>
        Pahalıdan ucuza
      </CategoryChip>
    </div>
  );
}
