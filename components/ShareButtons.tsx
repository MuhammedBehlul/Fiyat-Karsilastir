'use client';

import { useEffect, useState } from 'react';

/**
 * Ürün paylaşım düğmeleri: WhatsApp, X, bağlantı kopyala ve (destekleyen
 * cihazlarda) yerel paylaşım. url mutlak olmalı (siteUrl ile üretilir).
 */
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* pano erişimi yoksa sessizce geç */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      /* kullanıcı iptal etti */
    }
  }

  const btn =
    'inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-caption font-medium text-muted transition-colors hover:border-primary hover:text-primary';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-caption font-medium text-muted">Paylaş:</span>

      <a href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={btn} aria-label="WhatsApp'ta paylaş">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2Zm5.1 14.1c-.2.6-1.2 1.1-1.7 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.3.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.8-.1 1.5Z" />
        </svg>
        WhatsApp
      </a>

      <a href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className={btn} aria-label="X'te paylaş">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.9l-4.6-6-5.27 6H2.5l8-9.14L1.5 2h7.05l4.15 5.5L18.244 2Zm-1.21 18h1.83L7.05 3.9H5.1L17.034 20Z" />
        </svg>
        X
      </a>

      <button type="button" onClick={copy} className={btn} aria-label="Bağlantıyı kopyala">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
          <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
        </svg>
        {copied ? 'Kopyalandı' : 'Kopyala'}
      </button>

      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={btn} aria-label="Paylaş">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
          </svg>
          Paylaş
        </button>
      )}
    </div>
  );
}
