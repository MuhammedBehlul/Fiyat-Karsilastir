'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cx } from './ui/cx';

/**
 * Vercel'in next/image optimizer'ı görseli SUNUCU TARAFINDA (Vercel'in kendi
 * IP'sinden) çeker — kullanıcının tarayıcısından değil. Vatan Bilgisayar'ın
 * CDN'i bu isteği 502 OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED ile
 * reddediyor (muhtemelen tarama karşıtı IP/ASN filtresi — aynı sitenin
 * robots.txt'te ?page= parametresini de yasaklaması gibi, bkz. scrapers/).
 * Aynı görsel bir tarayıcıdan doğrudan istendiğinde sorunsuz açılıyor; bu
 * yüzden bu host'lar için optimizer'ı atlayıp tarayıcının doğrudan çekmesini
 * sağlıyoruz. Diğer 4 CDN (Trendyol/Hepsiburada/Amazon/N11) optimizer'dan
 * sorunsuz geçiyor, canlıda doğrulandı.
 */
const OPTIMIZER_BLOCKED_HOSTS = [/\.vatanbilgisayar\.com$/];

function isOptimizerBlocked(url: string): boolean {
  try {
    return OPTIMIZER_BLOCKED_HOSTS.some((re) => re.test(new URL(url).hostname));
  } catch {
    return false;
  }
}

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
      unoptimized={isPlaceholder || isOptimizerBlocked(url)}
      onError={() => setFailed(true)}
      className={cx('object-contain', className)}
    />
  );
}
