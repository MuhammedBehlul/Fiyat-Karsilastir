import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ScrapeTrigger from '@/components/admin/ScrapeTrigger';
import { getLastScrapeRuns, getPendingMatchReviews } from '@/lib/queries';
import { formatPrice } from '@/lib/normalize';
import { SITE_LABELS } from '@/lib/types';
import type { SiteName } from '@/lib/types';
import { logout } from './login/actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Yönetici paneli' };

// Durum rozetleri: sabit anlamlı bir küçük ölçek. `success` (yeşil) tasarım sisteminde
// yalnızca en ucuz/fiyat düşüşü içindir, bu yüzden burada kullanılmaz — tamamlanan
// çalışmalar nötr, hatalar `danger` rengiyle gösterilir.
const STATUS_STYLES: Record<string, string> = {
  success: 'bg-surface-alt text-text border border-border',
  error: 'bg-danger-soft text-danger',
  running: 'bg-primary-soft text-primary',
};

const STATUS_LABELS: Record<string, string> = {
  success: 'Tamamlandı',
  error: 'Hata',
  running: 'Çalışıyor',
};

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-caption font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-bold text-text tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-caption text-muted">{hint}</p>}
    </Card>
  );
}

export default async function AdminPage() {
  const runs = await getLastScrapeRuns().catch(() => []);
  const reviews = await getPendingMatchReviews().catch(() => []);

  const today = new Date().toISOString().slice(0, 10);
  const todayRuns = runs.filter((r) => r.startedAt.slice(0, 10) === today);
  const successRate = runs.length
    ? Math.round((runs.filter((r) => r.status === 'success').length / runs.length) * 100)
    : null;
  const productsToday = todayRuns.reduce((sum, r) => sum + r.productsUpserted, 0);
  const lastRunAt = runs[0]?.startedAt;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-text sm:text-2xl">Yönetici paneli</h1>
          <p className="mt-1 text-sm text-muted">Scraping çalışmaları ve eşleşme incelemeleri.</p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="secondary" size="sm">
            Çıkış yap
          </Button>
        </form>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="font-medium text-text">Scraping çalıştır</p>
          <p className="text-sm text-muted">
            Tüm siteleri ve kategorileri GitHub Actions üzerinden manuel olarak tetikler.
          </p>
        </div>
        <ScrapeTrigger />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Son tarama"
          value={lastRunAt ? new Date(lastRunAt).toLocaleString('tr-TR') : '—'}
        />
        <StatTile
          label="Başarı oranı"
          value={successRate === null ? '—' : `%${successRate}`}
          hint={`son ${runs.length} çalışma`}
        />
        <StatTile label="Bugün yazılan kayıt" value={productsToday.toLocaleString('tr-TR')} />
        <StatTile label="İncelemede bekleyen" value={reviews.length.toLocaleString('tr-TR')} />
      </div>

      <div>
        <h2 className="font-heading text-lg font-bold text-text sm:text-xl">Son scraping çalışmaları</h2>
        {runs.length === 0 ? (
          <Card className="mt-3 p-6 text-sm text-muted">Henüz scraping kaydı yok.</Card>
        ) : (
          <Card className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="p-3">Site</th>
                  <th className="p-3">Başlangıç</th>
                  <th className="p-3">Durum</th>
                  <th className="p-3 text-right">Bulunan</th>
                  <th className="p-3 text-right">Kaydedilen</th>
                  <th className="p-3">Hata</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-alt">
                    <td className="p-3 font-medium text-text">
                      {SITE_LABELS[r.siteName as SiteName] ?? r.siteName}
                    </td>
                    <td className="p-3 tabular-nums text-muted">
                      {new Date(r.startedAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-caption font-semibold ${STATUS_STYLES[r.status] ?? 'bg-surface-alt text-muted'}`}
                      >
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums text-text">{r.productsFound}</td>
                    <td className="p-3 text-right tabular-nums text-text">{r.productsUpserted}</td>
                    <td className="max-w-56 truncate p-3 text-xs text-muted" title={r.errorMessage ?? ''}>
                      {r.errorMessage ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div>
        <h2 className="font-heading text-lg font-bold text-text sm:text-xl">
          İnceleme bekleyen eşleşmeler
        </h2>
        <p className="mt-1 text-sm text-muted">
          Otomatik kabul eşiğinin altında kalan eşleşme adayları — bu kayıtlar sessizce
          birleştirilmedi, kendi ürünleri altında tutuldu.
        </p>
        {reviews.length === 0 ? (
          <Card className="mt-3 p-6 text-sm text-muted">İnceleme bekleyen eşleşme yok.</Card>
        ) : (
          <Card className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="p-3">Site</th>
                  <th className="p-3">Başlık</th>
                  <th className="p-3">Neden</th>
                  <th className="p-3 text-right">Skor</th>
                  <th className="p-3 text-right">Fiyat</th>
                  <th className="p-3">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-alt">
                    <td className="p-3 font-medium text-text">
                      {SITE_LABELS[r.siteName as SiteName] ?? r.siteName}
                    </td>
                    <td className="max-w-80 p-3 text-muted">
                      <a
                        href={r.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-2 hover:underline"
                      >
                        {r.rawTitle}
                      </a>
                    </td>
                    <td className="p-3 text-xs text-muted">{r.reason}</td>
                    <td className="p-3 text-right tabular-nums text-text">
                      {r.score > 0 ? r.score.toFixed(2) : '—'}
                    </td>
                    <td className="p-3 text-right tabular-nums text-text">{formatPrice(r.price)}</td>
                    <td className="p-3 tabular-nums text-muted">
                      {new Date(r.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
