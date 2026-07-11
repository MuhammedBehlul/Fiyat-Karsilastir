import Link from 'next/link';
import {
  buildQuery,
  capacityLabel,
  colorLabel,
  hasActiveFilters,
  parseFilters,
  removeListValue,
  type SearchParamsRecord,
} from '@/lib/filters';
import { formatPrice } from '@/lib/normalize';
import { CloseIcon } from './icons';

/**
 * Uygulanan filtrelerin kaldırılabilir çipleri. İstemci JS'i yok: her çip,
 * o filtre değeri düşülmüş URL'ye giden bir Link'tir.
 */
interface Chip {
  key: string;
  label: string;
  href: string;
}

export default function ActiveFilterChips({
  basePath,
  searchParams,
}: {
  basePath: string;
  searchParams: SearchParamsRecord;
}) {
  const filters = parseFilters(searchParams);
  if (!hasActiveFilters(filters)) return null;

  const chips: Chip[] = [];
  const removeFromList = (param: string, value: string) =>
    basePath + buildQuery(searchParams, (p) => removeListValue(p, param, value));
  const removeParam = (param: string) => basePath + buildQuery(searchParams, (p) => p.delete(param));

  for (const b of filters.brand ?? []) chips.push({ key: `brand-${b}`, label: b, href: removeFromList('brand', b) });
  for (const s of filters.storageGb ?? [])
    chips.push({ key: `storage-${s}`, label: capacityLabel(s), href: removeFromList('storage', String(s)) });
  for (const r of filters.ramGb ?? [])
    chips.push({ key: `ram-${r}`, label: `${r} GB RAM`, href: removeFromList('ram', String(r)) });
  for (const c of filters.color ?? [])
    chips.push({ key: `color-${c}`, label: colorLabel(c), href: removeFromList('color', c) });
  if (filters.minPrice != null)
    chips.push({ key: 'min', label: `≥ ${formatPrice(filters.minPrice)}`, href: removeParam('min') });
  if (filters.maxPrice != null)
    chips.push({ key: 'max', label: `≤ ${formatPrice(filters.maxPrice)}`, href: removeParam('max') });
  if (filters.comparableOnly)
    chips.push({ key: 'comparable', label: '2+ mağazada', href: removeParam('comparable') });

  // "Temizle": tüm filtreler düşer, sıralama korunur.
  const clearHref =
    basePath +
    buildQuery(searchParams, (p) => {
      for (const key of ['brand', 'storage', 'ram', 'color', 'min', 'max', 'comparable']) p.delete(key);
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-3 text-caption font-medium text-primary transition-colors hover:border-primary"
          title="Filtreyi kaldır"
        >
          {chip.label}
          <CloseIcon className="h-3 w-3" />
        </Link>
      ))}
      <Link href={clearHref} className="text-caption font-medium text-muted underline-offset-2 hover:text-primary hover:underline">
        Filtreleri temizle
      </Link>
    </div>
  );
}
