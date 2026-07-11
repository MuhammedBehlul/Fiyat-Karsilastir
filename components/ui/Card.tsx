import type { HTMLAttributes } from 'react';
import { cx } from './cx';

/**
 * Kart temel yapısı: beyaz zemin, ince kenarlık, gölgesiz.
 * `interactive` yalnızca tıklanabilir kartlarda (ürün kartı) kullanılır —
 * hover'da kenarlık primary'ye döner, gölge/scale efekti YOK.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export default function Card({ interactive = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-border bg-surface shadow-premium transition-all duration-300',
        interactive && 'hover:-translate-y-1 hover:border-primary/40 hover:shadow-premium-hover cursor-pointer',
        className,
      )}
      {...rest}
    />
  );
}
