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
  active: 'bg-primary-soft text-primary',
  success: 'bg-surface-alt text-text border border-border',
  failure: 'bg-danger-soft text-danger',
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
      <Button onClick={handleTrigger} disabled={triggering || active}>
        {active ? 'Scraping çalışıyor…' : triggering ? 'Tetikleniyor…' : 'Scraping başlat'}
      </Button>
      {run && label && (
        <a
          href={run.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted hover:underline"
        >
          <span className={`rounded-full px-2.5 py-1 text-caption font-semibold ${STATUS_BADGE[badgeKey]}`}>
            {label}
          </span>
          #{run.runNumber} · GitHub&apos;da görüntüle
        </a>
      )}
      {error && <span className="text-sm text-danger">{error}</span>}
    </div>
  );
}
