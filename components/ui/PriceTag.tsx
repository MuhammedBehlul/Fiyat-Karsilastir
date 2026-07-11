import { formatPrice } from '@/lib/normalize';
import { cx } from './cx';

/*
 * Fiyat her zaman sayfadaki en belirgin eleman: mono font + tabular-nums,
 * eski fiyat üstü çizili ve soluk. Tutarlılık için fiyat ASLA elle
 * biçimlendirilmez — her yerde bu bileşen kullanılır.
 */
export type PriceTagSize = 'sm' | 'md' | 'lg';

const PRICE_SIZE: Record<PriceTagSize, string> = {
  sm: 'text-price-sm',
  md: 'text-price',
  lg: 'text-price-lg',
};

const OLD_SIZE: Record<PriceTagSize, string> = {
  sm: 'text-caption',
  md: 'text-body-sm',
  lg: 'text-body',
};

export interface PriceTagProps {
  price: number;
  /** Üstü çizili gösterilecek önceki fiyat (price'tan büyükse gösterilir). */
  oldPrice?: number | null;
  currency?: string;
  size?: PriceTagSize;
  /** cheapest: "en ucuz" fiyatı yeşil vurgular (semantik). */
  tone?: 'default' | 'cheapest';
  className?: string;
}

export default function PriceTag({
  price,
  oldPrice,
  currency = 'TRY',
  size = 'md',
  tone = 'default',
  className,
}: PriceTagProps) {
  const showOld = oldPrice != null && oldPrice > price;
  return (
    <span className={cx('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      {showOld && (
        <del className={cx('font-mono tabular-nums text-muted', OLD_SIZE[size])}>
          {formatPrice(oldPrice, currency)}
        </del>
      )}
      <span
        className={cx(
          'font-mono font-semibold tabular-nums',
          tone === 'cheapest' ? 'text-success' : 'text-text',
          PRICE_SIZE[size],
        )}
      >
        {formatPrice(price, currency)}
      </span>
    </span>
  );
}
