'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cx } from './ui/cx';

/**
 * Ürün görseli — next/image (fill) ile optimize edilir. Kaynak yok ya da
 * yüklenemezse placeholder'a düşer (harici CDN görseli 404/engel verirse sayfa
 * bozulmasın). Kapsayıcı `relative` ve sabit boyutlu olmalı.
 *
 * next.config.ts'deki remotePatterns'da OLMAYAN bir host <Image> tarafından
 * render anında reddedilir — bu yüzden yalnızca taradığımız CDN'ler yeterli.
 */
export default function ProductImage({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const isPlaceholder = !src || failed;
  const url = isPlaceholder ? '/placeholder.svg' : src;

  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      referrerPolicy="no-referrer"
      unoptimized={isPlaceholder}
      onError={() => setFailed(true)}
      className={cx('object-contain', className)}
    />
  );
}
