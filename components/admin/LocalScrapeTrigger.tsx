'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { CATEGORIES, SITES, SITE_LABELS, type CategorySlug, type SiteName } from '@/lib/types';

interface SiteResultSummary {
  site: SiteName;
  productsFound: number;
  productsUpserted: number;
  error?: boolean;
}

interface RunProgress {
  totalSites: number;
  totalCategories: number;
  doneCategories: number;
  siteIndex: number | null;
  currentSite: SiteName | null;
  currentCategory: CategorySlug | null;
  currentCategoryIndex: number | null;
  currentCategoryTotal: number | null;
  sitesPlan: { site: SiteName; categories: number }[];
  siteResults: SiteResultSummary[];
}

interface LocalStatus {
  allowed: boolean;
  running?: boolean;
  startedAt?: string | null;
  finishedAt?: string | null;
  exitCode?: number | null;
  sites?: SiteName[];
  log?: string[];
  progress?: RunProgress | null;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

/**
 * GitHub Actions'ın IP'si bazı sitelerde (ör. Trendyol) engellenebiliyor —
 * bu buton scraper'ı ADMIN PANELİNİ SUNAN MAKİNEDE, ayrı bir alt süreç olarak
 * çalıştırır. Yalnızca `npm run dev` altında işlev görür: hem bu bileşen hem
 * de API rotası NODE_ENV=production'da kapalıdır (bkz. scrapers/local-runner.ts) —
 * deploy edilmiş bir örnekte buton hiç görünmez.
 *
 * İlerleme (hangi site, hangi kategori, % kaç) scrapers/progress-protocol.ts
 * üzerinden alt sürecin stdout'una yazdığı yapılandırılmış satırlardan gelir —
 * eski koddan başlamış bir çalışmada bu alan boş olabilir, o durumda yalnızca
 * ham log gösterilir (bkz. detaylı log bölümü).
 */
const ALL_CATEGORY_SLUGS = Object.keys(CATEGORIES) as CategorySlug[];

export default function LocalScrapeTrigger() {
  const router = useRouter();
  const [status, setStatus] = useState<LocalStatus | null>(null);
  const [selected, setSelected] = useState<Set<SiteName>>(new Set(SITES));
  const [selectedCategories, setSelectedCategories] = useState<Set<CategorySlug>>(
    new Set(ALL_CATEGORY_SLUGS),
  );
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const wasRunning = useRef(false);
  const logRef = useRef<HTMLPreElement>(null);

  async function poll() {
    try {
      const res = await fetch('/api/admin/local-scrape-status', { cache: 'no-store' });
      const data: LocalStatus = await res.json();
      setStatus(data);
      if (wasRunning.current && !data.running) router.refresh();
      wasRunning.current = Boolean(data.running);
    } catch {
      // Sessizce yut: bağlantı sorununda buton devre dışı kalmasın, bir sonraki turda tekrar dener.
    }
  }

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function loop() {
      await poll();
      if (cancelled) return;
      timer = setTimeout(loop, wasRunning.current ? 1500 : 8000);
    }
    loop();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Çalışırken geçen süreyi saniye saniye güncelle (ayrı bir sunucu isteği gerektirmez).
  useEffect(() => {
    if (!status?.running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status?.running]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [status?.log]);

  function toggleSite(site: SiteName) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(site)) next.delete(site);
      else next.add(site);
      return next;
    });
  }

  function toggleCategory(category: CategorySlug) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  async function handleTrigger() {
    setTriggering(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/trigger-scrape-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sites: [...selected], categories: [...selectedCategories] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Tetikleme başarısız');
      wasRunning.current = true;
      setTimeout(poll, 500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTriggering(false);
    }
  }

  // Üretimde (deploy edilmiş örnekte) hiç görünmez.
  if (status && !status.allowed) return null;

  const running = Boolean(status?.running);
  const progress = status?.progress ?? null;
  const percent =
    progress && progress.totalCategories > 0
      ? Math.round((progress.doneCategories / progress.totalCategories) * 100)
      : null;
  const elapsed =
    running && status?.startedAt ? formatElapsed(now - new Date(status.startedAt).getTime()) : null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-premium">
      <div>
        <p className="font-heading text-base font-bold text-text">Yerel Scraper Çalıştır</p>
        <p className="mt-1 text-sm text-muted">
          Scraper&apos;ı bu sunucunun barındığı makinede yerel alt süreç olarak çalıştırır.
          Yalnızca <code className="rounded bg-surface-alt px-1 py-0.5 font-mono text-caption text-primary">npm run dev</code> ile geliştirme ortamında etkindir.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 border-y border-border/50 py-3">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">Siteler</p>
        <div className="flex flex-wrap gap-4">
          {SITES.map((site) => (
            <label key={site} className="flex cursor-pointer items-center gap-2 text-sm text-text select-none hover:text-primary transition-colors">
              <input
                type="checkbox"
                checked={selected.has(site)}
                disabled={running}
                onChange={() => toggleSite(site)}
                className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary accent-primary cursor-pointer disabled:cursor-not-allowed"
              />
              {SITE_LABELS[site]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-b border-border/50 pb-3">
        <div className="flex items-center justify-between">
          <p className="text-caption font-semibold uppercase tracking-wide text-muted">
            Kategoriler{' '}
            <span className="font-normal normal-case text-muted/70">
              (boş bırakma — hiçbiri seçilmezse tetiklenemez)
            </span>
          </p>
          {!running && (
            <div className="flex gap-2 text-caption">
              <button
                type="button"
                onClick={() => setSelectedCategories(new Set(ALL_CATEGORY_SLUGS))}
                className="text-primary hover:underline"
              >
                Tümünü seç
              </button>
              <span className="text-border-strong">·</span>
              <button
                type="button"
                onClick={() => setSelectedCategories(new Set())}
                className="text-primary hover:underline"
              >
                Tümünü kaldır
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {ALL_CATEGORY_SLUGS.map((slug) => (
            <label key={slug} className="flex cursor-pointer items-center gap-2 text-sm text-text select-none hover:text-primary transition-colors">
              <input
                type="checkbox"
                checked={selectedCategories.has(slug)}
                disabled={running}
                onChange={() => toggleCategory(slug)}
                className="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary accent-primary cursor-pointer disabled:cursor-not-allowed"
              />
              {CATEGORIES[slug]}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleTrigger}
          disabled={triggering || running || selected.size === 0 || selectedCategories.size === 0}
          variant="secondary"
          size="sm"
        >
          {running ? 'Çalışıyor…' : triggering ? 'Tetikleniyor…' : 'Localden başlat'}
        </Button>
        {status?.finishedAt && !running && (
          <span className="text-sm text-muted">
            Son çalışma: exit {status.exitCode} ·{' '}
            {new Date(status.finishedAt).toLocaleTimeString('tr-TR')}
          </span>
        )}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>

      {running && (
        <div className="flex flex-col gap-3 rounded-xl bg-surface-alt border border-border p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium text-text">
              {!progress?.currentSite && (
                <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>
                {progress?.currentSite
                  ? `Site ${progress.siteIndex}/${progress.totalSites}: ${SITE_LABELS[progress.currentSite]}`
                  : 'Scraper başlatılıyor…'}
                {progress?.currentCategory && (
                  <span className="text-muted font-normal">
                    {' '}— Kategori {progress.currentCategoryIndex}/{progress.currentCategoryTotal}:{' '}
                    <span className="text-text font-medium">{CATEGORIES[progress.currentCategory] ?? progress.currentCategory}</span>
                  </span>
                )}
              </span>
            </div>
            {elapsed && <span className="tabular-nums font-mono text-muted bg-surface rounded px-2 py-0.5 border border-border text-xs">{elapsed}</span>}
          </div>

          {percent !== null && (
            <div className="w-full">
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500 animate-pulse"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-caption text-muted">
                <span>%{percent} tamamlandı</span>
                <span>{progress!.doneCategories}/{progress!.totalCategories} kategori</span>
              </div>
            </div>
          )}

          {progress && progress.siteResults.length > 0 && (
            <div className="mt-1 border-t border-border/50 pt-2">
              <p className="text-caption font-semibold text-text mb-1.5">Tamamlanan Siteler:</p>
              <ul className="flex flex-col gap-1.5 text-caption">
                {progress.siteResults.map((r) => (
                  <li key={r.site} className="flex items-center gap-2">
                    {r.error ? (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-danger-soft text-danger font-bold text-[10px]">✕</span>
                    ) : (
                      <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-success-soft text-success font-bold text-[10px]">✓</span>
                    )}
                    <span className="font-semibold text-text">{SITE_LABELS[r.site]}</span>
                    <span className="text-muted">
                      {r.productsUpserted} kayıt yazıldı ({r.productsFound} bulundu)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {status?.log && status.log.length > 0 && (
        <details className="group" open={running}>
          <summary className="flex cursor-pointer items-center justify-between text-sm text-muted hover:text-text select-none">
            <span className="font-medium">Ham log ({status.log.length} satır)</span>
            <span className="text-caption text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity">
              {running ? 'Otomatik açıldı · Canlı akıyor' : 'Tıklayarak göster/gizle'}
            </span>
          </summary>
          <pre
            ref={logRef}
            className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-slate-200 shadow-inner scrollbar-none"
          >
            {status.log.join('\n')}
          </pre>
        </details>
      )}
    </div>
  );
}
