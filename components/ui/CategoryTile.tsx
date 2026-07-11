import Link from 'next/link';
import type { ReactNode } from 'react';
import Card from './Card';

/**
 * Kategori kartı: ikon + etiket, ana sayfa ve kategori gezinme alanlarında
 * kullanılır. CategoryChip'ten farkı — chip aktif/pasif filtre durumu içindir,
 * CategoryTile yalnızca gezinme linkidir.
 */
export interface CategoryTileProps {
  href: string;
  icon: ReactNode;
  label: string;
}

export default function CategoryTile({ href, icon, label }: CategoryTileProps) {
  return (
    <Link href={href} className="group">
      <Card interactive className="flex flex-col items-center gap-3 p-5 text-center transition-all duration-300">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:shadow-md group-hover:shadow-primary/20">
          {icon}
        </span>
        <span className="text-body-sm font-semibold text-text group-hover:text-primary transition-colors duration-200">
          {label}
        </span>
      </Card>
    </Link>
  );
}
