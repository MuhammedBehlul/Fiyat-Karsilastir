import Link from 'next/link';

/**
 * Sayfa üstü gezinti izi. Son öğe geçerli sayfadır — href verilmez.
 * İçerikten bağımsız saf primitif; veri çekmez.
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Gezinti izi" className="flex flex-wrap items-center gap-1.5 text-caption text-muted">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>/</span>}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="line-clamp-1 max-w-72 font-medium text-text">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
