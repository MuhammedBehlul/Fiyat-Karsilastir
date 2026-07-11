import type { SiteName } from '@/lib/types';
import { SITE_LABELS } from '@/lib/types';

// Fiyat geçmişi grafiğiyle birebir aynı renkler (dataviz skill ile doğrulandı) —
// bir site her yerde aynı renkle tanınsın diye rozet noktası ve grafik aynı paleti paylaşır.
// Rozetin kendisi nötr (gri çerçeve): renk yalnızca tanıma noktası olarak kullanılır.
export const SITE_COLOR_VAR: Record<SiteName, string> = {
  trendyol: 'var(--color-site-trendyol)',
  hepsiburada: 'var(--color-site-hepsiburada)',
  amazon: 'var(--color-site-amazon)',
  vatan: 'var(--color-site-vatan)',
  n11: 'var(--color-site-n11)',
};

export default function SiteBadge({ site }: { site: SiteName }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-caption font-medium text-text">
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: SITE_COLOR_VAR[site] }}
      />
      {SITE_LABELS[site]}
    </span>
  );
}
