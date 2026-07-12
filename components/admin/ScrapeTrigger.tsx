'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface RunStatus {
  id: number;
  status: string; // queued | in_progress | completed
  conclusion: string | null; // success | failure | cancelled | null
  runNumber: number;
  htmlUrl: string;
  createdAt: string;
}

const ACTIVE_STATUSES = new Set(['queued', 'in_progress']);

const STATUS_LABEL: Record<string, string> = {
  queued: 'Sırada',
  in_progress: 'Çalışıyor',
};

const CONCLUSION_LABEL: Record<string, string> = {
  success: 'Tamamlandı',
  failure: 'Hata',
  cancelled: 'İptal edildi',
};

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-primary-soft text-primary border border-primary/20 animate-pulse',
  success: 'bg-success-soft text-success border border-success/20',
  failure: 'bg-danger-soft text-danger border border-danger/20',
};

export default function ScrapeTrigger() {
  const router = useRouter();
  const [run, setRun] = useState<RunStatus | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wasActive = useRef(false);

  async function poll(): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/scrape-status', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Durum alınamadı');

      const latest: RunStatus | undefined = data.runs?.[0];
      setError(null);
      setRun(latest ?? null);

      const active = latest ? ACTIVE_STATUSES.has(latest.status) : false;
      if (wasActive.current && !active) router.refresh();
      wasActive.current = active;
      return active;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function loop() {
      const active = await poll();
      if (cancelled) return;
      timer = setTimeout(loop, active ? 5000 : 30000);
    }
    loop();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleTrigger() {
    setTriggering(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/trigger-scrape', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Tetikleme başarısız');
      wasActive.current = true;
      setTimeout(poll, 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTriggering(false);
    }
  }

  const active = run ? ACTIVE_STATUSES.has(run.status) : false;
  const badgeKey = active ? 'active' : run?.conclusion === 'success' ? 'success' : 'failure';
  const label = active
    ? (STATUS_LABEL[run!.status] ?? run!.status)
    : run
      ? (CONCLUSION_LABEL[run.conclusion ?? ''] ?? run.conclusion ?? run.status)
      : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={handleTrigger}
        disabled={triggering || active}
        variant={active ? 'secondary' : 'primary'}
        size="sm"
        className="flex items-center gap-2"
      >
        {(triggering || active) && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {active ? 'GitHub Tarayıcı Çalışıyor…' : triggering ? 'Tetikleniyor…' : 'GitHub Actions Başlat'}
      </Button>
      {run && label && (
        <a
          href={run.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors hover:underline"
        >
          <span className={`rounded-full px-2.5 py-0.5 text-caption font-semibold ${STATUS_BADGE[badgeKey]}`}>
            {label}
          </span>
          <span className="font-mono text-xs">#{run.runNumber}</span> · GitHub Actions&apos;da gör
        </a>
      )}
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
