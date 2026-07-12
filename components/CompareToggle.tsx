'use client';

import { COMPARE_MAX, toggleCompare, useCompare } from '@/lib/useCompare';
import { CompareIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/cx';

/**
 * Karşılaştırmaya ekle/çıkar düğmesi. ProductCard içinde <Link> üstünde durur —
 * karta yayılmasın diye preventDefault/stopPropagation.
 */
export default function CompareToggle({
  variantId,
  variant = 'overlay',
}: {
  variantId: number;
  variant?: 'overlay' | 'inline';
}) {
  const ids = useCompare();
  const active = ids.includes(variantId);
  const full = !active && ids.length >= COMPARE_MAX;

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (full) return;
    toggleCompare(variantId);
  }

  const label = active
    ? 'Karşılaştırmadan çıkar'
    : full
      ? `En fazla ${COMPARE_MAX} ürün karşılaştırılır`
      : 'Karşılaştır';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      disabled={full}
      className={cx(
        'inline-flex items-center justify-center rounded-full transition-all active:scale-90',
        variant === 'overlay'
          ? 'h-9 w-9 border border-border bg-surface/90 shadow-sm backdrop-blur-sm hover:bg-surface'
          : 'h-11 gap-2 border border-border-strong bg-surface px-4 hover:border-primary',
        active ? 'text-primary' : 'text-muted hover:text-primary',
        full && 'cursor-not-allowed opacity-40',
      )}
    >
      <CompareIcon className={variant === 'overlay' ? 'h-4.5 w-4.5' : 'h-5 w-5'} />
      {variant === 'inline' && (
        <span className="text-body-sm font-medium">{active ? 'Karşılaştırmada' : 'Karşılaştır'}</span>
      )}
    </button>
  );
}
