import type { HTMLAttributes } from 'react';
import { cx } from './cx';

/*
 * Rozet varyantları semantiktir, dekoratif seçme:
 * - discount : indirim oranı ("%12") — accent, dolgulu
 * - cheapest : "En ucuz" işareti — success, yumuşak zemin
 * - danger   : fiyat yükselişi / uyarı
 * - info     : bilgi etiketi (örn. "5 mağaza")
 * - neutral  : durumu olmayan meta etiket
 */
export type BadgeVariant = 'discount' | 'cheapest' | 'danger' | 'info' | 'neutral';

const VARIANT: Record<BadgeVariant, string> = {
  discount: 'bg-gradient-to-r from-accent to-red-500 text-white shadow-sm font-bold',
  cheapest: 'bg-success-soft text-success border border-success/15 font-semibold',
  danger: 'bg-danger-soft text-danger border border-danger/15',
  info: 'bg-primary-soft text-primary border border-primary/15',
  neutral: 'bg-surface-alt text-muted border border-border',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export default function Badge({ variant = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold',
        VARIANT[variant],
        className,
      )}
      {...rest}
    />
  );
}
