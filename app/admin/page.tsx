import { getLastScrapeRuns, getPendingMatchReviews } from '@/lib/queries';
import { formatPrice } from '@/lib/normalize';
import { SITE_LABELS } from '@/lib/types';
import type { SiteName } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Scraping logları' };

// Durum rozetleri: sabit anlamlı bir küçük ölçek, marka/kategorik paletten bağımsız.
const STATUS_STYLES: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-800',
  error: 'bg-red-100 text-red-800',
  running: 'bg-amber-100 text-amber-800',
};

export default async function AdminPage() {
  const runs = await getLastScrapeRuns().catch(() => []);
  const reviews = await getPendingMatchReviews().catch(() => []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-xl font-bold text-text sm:text-2xl">Son scraping çalışmaları</h1>
      {runs.length === 0 ? (
        <p className="rounded-lg border border-border bg-white p-6 text-sm text-muted">
          Henüz scraping kaydı yok.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
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
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium text-text">
                    {SITE_LABELS[r.siteName as SiteName] ?? r.siteName}
                  </td>
                  <td className="p-3 tabular-nums text-muted">
                    {new Date(r.startedAt).toLocaleString('tr-TR')}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? 'bg-primary-soft text-primary'}`}
                    >
                      {r.status}
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
        </div>
      )}

      <h2 className="mt-4 font-heading text-lg font-bold text-text sm:text-xl">
        İnceleme bekleyen eşleşmeler
      </h2>
      <p className="text-sm text-muted">
        Otomatik kabul eşiğinin altında kalan eşleşme adayları — bu kayıtlar sessizce
        birleştirilmedi, kendi ürünleri altında tutuldu.
      </p>
      {reviews.length === 0 ? (
        <p className="rounded-lg border border-border bg-white p-6 text-sm text-muted">
          İnceleme bekleyen eşleşme yok.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
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
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium text-text">
                    {SITE_LABELS[r.siteName as SiteName] ?? r.siteName}
                  </td>
                  <td className="max-w-80 p-3 text-muted">
                    <a href={r.productUrl} target="_blank" rel="noreferrer" className="line-clamp-2 hover:underline">
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
        </div>
      )}
    </div>
  );
}
