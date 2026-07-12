'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { toggleFavorite } from '@/app/hesap/mutations';
import { HeartIcon } from '@/components/ui/icons';
import { cx } from '@/components/ui/cx';

/**
 * Favori (kalp) düğmesi. ProductCard içinde <Link> üstünde durur — tıklama
 * karta yayılmasın diye preventDefault/stopPropagation. Oturum yoksa girişe yollar.
 * Durum iyimser güncellenir; sunucu hatasında geri alınır.
 */
export default function FavoriteButton({
  variantId,
  initialActive = false,
  variant = 'overlay',
}: {
  variantId: number;
  initialActive?: boolean;
  variant?: 'overlay' | 'inline';
}) {
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const prev = active;
    setActive(!prev); // iyimser
    startTransition(async () => {
      const res = await toggleFavorite(variantId);
      if ('needsAuth' in res) {
        setActive(prev);
        router.push(`/giris?next=${encodeURIComponent(pathname)}`);
      } else {
        setActive(res.active);
      }
    });
  }

  const label = active ? 'Favorilerden çıkar' : 'Favorilere ekle';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex items-center justify-center rounded-full transition-all active:scale-90',
        variant === 'overlay'
          ? 'h-9 w-9 border border-border bg-surface/90 shadow-sm backdrop-blur-sm hover:bg-surface'
          : 'h-11 w-11 border border-border-strong bg-surface hover:border-danger',
        active ? 'text-danger' : 'text-muted hover:text-danger',
        pending && 'opacity-70',
      )}
    >
      <HeartIcon filled={active} className={variant === 'overlay' ? 'h-4.5 w-4.5' : 'h-5 w-5'} />
    </button>
  );
}
