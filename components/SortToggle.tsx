import CategoryChip from './ui/CategoryChip';

// JS'siz sıralama: query string'e sort=asc|desc ekleyen düz linkler,
// CategoryChip'in aktif/pasif pill görünümü yeniden kullanılır.
export default function SortToggle({
  basePath,
  query,
  direction,
}: {
  basePath: string;
  query?: string;
  direction: 'asc' | 'desc';
}) {
  const hrefFor = (sort: 'asc' | 'desc') => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('sort', sort);
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex items-center gap-2 text-body-sm">
      <span className="text-muted">Sırala:</span>
      <CategoryChip href={hrefFor('asc')} active={direction === 'asc'}>
        Ucuzdan pahalıya
      </CategoryChip>
      <CategoryChip href={hrefFor('desc')} active={direction === 'desc'}>
        Pahalıdan ucuza
      </CategoryChip>
    </div>
  );
}
