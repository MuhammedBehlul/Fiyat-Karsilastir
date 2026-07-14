'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const KEY = 'fk_cookie_ack';

/**
 * Hafif çerez bilgilendirmesi (onay duvarı değil) — yalnızca zorunlu çerez
 * kullanıldığından bilgilendirme yeterli. Kapatma tercihi localStorage'da tutulur.
 * İleride reklam/analitik eklenirse buradan gerçek onay yönetimine yükseltilebilir.
 */
export default function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(localStorage.getItem(KEY) !== '1');
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(KEY, '1');
    setShow(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-border bg-surface/95 p-4 shadow-premium backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted">
          Yalnızca hizmetin çalışması için gerekli zorunlu çerezleri kullanıyoruz.{' '}
          <Link href="/cerez-politikasi" className="font-medium text-primary hover:underline">
            Çerez Politikası
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-caption font-semibold text-white transition-colors hover:bg-primary-strong"
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
