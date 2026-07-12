'use client';

import Link from 'next/link';
import { clearCompare, useCompare } from '@/lib/useCompare';
import { CompareIcon } from '@/components/ui/icons';

/**
 * Sayfanın altında sabit duran karşılaştırma tepsisi — en az bir ürün
 * seçiliyken görünür. Layout'ta global olarak render edilir; sayfalar arası kalır.
 */
export default function CompareTray() {
  const ids = useCompare();
  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface/95 px-4 py-3 shadow-premium backdrop-blur-md">
        <span className="flex items-center gap-2 text-body-sm font-medium text-text">
          <CompareIcon className="h-5 w-5 text-primary" />
          <span className="font-mono font-semibold tabular-nums">{ids.length}</span> ürün seçildi
        </span>
        <Link
          href={`/karsilastir?ids=${ids.join(',')}`}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-body-sm font-semibold text-white transition-colors hover:bg-primary-strong"
        >
          Karşılaştır
        </Link>
        <button
          type="button"
          onClick={clearCompare}
          className="text-caption font-medium text-muted transition-colors hover:text-danger"
        >
          Temizle
        </button>
      </div>
    </div>
  );
}
