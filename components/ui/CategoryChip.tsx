import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * Kategori çipi: href verilirse Link, verilmezse span (statik etiket).
 * Aktif çip primary dolgulu — sayfada aynı anda tek aktif çip olur.
 */
export interface CategoryChipProps {
  href?: string;
  active?: boolean;
  className?: string;
  children: ReactNode;
}

export default function CategoryChip({
  href,
  active = false,
  className,
  children,
}: CategoryChipProps) {
  const classes = cx(
    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-body-sm font-medium transition-colors',
    active
      ? 'border-primary bg-primary text-white'
      : 'border-border bg-surface text-text hover:border-primary hover:text-primary',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-current={active ? 'page' : undefined}>
        {children}
      </Link>
    );
  }
  return <span className={classes}>{children}</span>;
}
