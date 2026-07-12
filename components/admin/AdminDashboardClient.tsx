'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ScrapeTrigger from '@/components/admin/ScrapeTrigger';
import LocalScrapeTrigger from '@/components/admin/LocalScrapeTrigger';
import { SITE_LABELS } from '@/lib/types';
import type { SiteName } from '@/lib/types';
import { formatPrice } from '@/lib/normalize';
import Badge from '@/components/ui/Badge';

interface ScrapeRun {
  id: number;
  siteName: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  productsFound: number;
  productsUpserted: number;
  errorMessage: string | null;
}

interface MatchReview {
  id: number;
  siteName: string;
  rawTitle: string;
  reason: string;
  score: number;
  price: number;
  createdAt: string;
  productUrl: string;
}

interface AdminDashboardClientProps {
  initialRuns: ScrapeRun[];
  initialReviews: MatchReview[];
  logoutAction: () => Promise<void>;
}

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-success-soft text-success border border-success/20',
  error: 'bg-danger-soft text-danger border border-danger/20',
  running: 'bg-primary-soft text-primary border border-primary/20 animate-pulse',
};

const STATUS_LABELS: Record<string, string> = {
  success: 'Tamamlandı',
  error: 'Hata',
  running: 'Çalışıyor',
};

function StatTile({
  label,
  value,
  hint,
  icon,
  borderColor = 'border-border',
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <Card className={`p-5 flex items-center justify-between border-l-4 ${borderColor}`}>
      <div className="flex flex-col">
        <p className="text-caption font-bold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-2 font-heading text-2xl font-black text-text tabular-nums leading-none">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted font-medium">{hint}</p>}
      </div>
      {icon && <div className="text-muted/40 p-2 bg-surface-alt rounded-xl">{icon}</div>}
    </Card>
  );
}

export default function AdminDashboardClient({
  initialRuns,
  initialReviews,
  logoutAction,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'scraper' | 'reviews'>('scraper');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const today = new Date().toISOString().slice(0, 10);
  const todayRuns = initialRuns.filter((r) => r.startedAt.slice(0, 10) === today);
  const successRate = initialRuns.length
    ? Math.round((initialRuns.filter((r) => r.status === 'success').length / initialRuns.length) * 100)
    : null;
  const productsToday = todayRuns.reduce((sum, r) => sum + r.productsUpserted, 0);
  const lastRunAt = initialRuns[0]?.startedAt;

  // Filter pending reviews
  const filteredReviews = initialReviews.filter((r) => {
    const matchesSite = siteFilter === 'all' || r.siteName === siteFilter;
    const matchesSearch =
      r.rawTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSite && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Üst Başlık & Çıkış Yap */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-text sm:text-3xl">Yönetici Paneli</h1>
          <p className="mt-1 text-sm text-muted">
            Ürün tarama faaliyetlerini izleyin ve otomatik eşleşme kararlarını gözden geçirin.
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm" className="shadow-sm">
            Çıkış Yap
          </Button>
        </form>
      </div>

      {/* İstatistik Paneli */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Son Tarama"
          value={lastRunAt ? new Date(lastRunAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—'}
          hint={lastRunAt ? new Date(lastRunAt).toLocaleDateString('tr-TR') : undefined}
          borderColor="border-primary"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatTile
          label="Başarı Oranı"
          value={successRate === null ? '—' : `%${successRate}`}
          hint={`Son ${initialRuns.length} taramada`}
          borderColor="border-success"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatTile
          label="Bugün Kaydedilen"
          value={productsToday.toLocaleString('tr-TR')}
          hint="Veritabanına eklenen yeni ürünler"
          borderColor="border-accent"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          }
        />
        <StatTile
          label="Bekleyen Eşleşme"
          value={initialReviews.length.toLocaleString('tr-TR')}
          hint="Karar bekleyen aday ürün"
          borderColor="border-amber-500"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
        />
      </div>

      {/* Sekme Seçiciler (Tab Buttons) */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('scraper')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-heading text-sm font-bold transition-all ${
            activeTab === 'scraper'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:border-border hover:text-text'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Tarama Merkezi
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-heading text-sm font-bold transition-all ${
            activeTab === 'reviews'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:border-border hover:text-text'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Eşleşme İncelemeleri
          {initialReviews.length > 0 && (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-white leading-none">
              {initialReviews.length}
            </span>
          )}
        </button>
      </div>

      {/* Sekme İçerikleri */}
      {activeTab === 'scraper' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sol Sütun: Scraper Kontrolleri */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* GitHub Actions Tetikleyici */}
            <Card className="flex flex-col gap-3 p-5">
              <div>
                <p className="font-heading text-base font-bold text-text">Bulut Scraper Çalıştır</p>
                <p className="text-sm text-muted">
                  Tüm siteleri ve kategorileri GitHub Actions sunucularında uzaktan tetikler.
                </p>
              </div>
              <ScrapeTrigger />
            </Card>

            {/* Yerel Scraper Tetikleyici */}
            <LocalScrapeTrigger />
          </div>

          {/* Sağ Sütun: Geçmiş Çalışmalar */}
          <div className="lg:col-span-7">
            <h2 className="font-heading text-base font-bold text-text mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Son Scraping Çalışmaları
            </h2>
            {initialRuns.length === 0 ? (
              <Card className="p-6 text-sm text-muted">Henüz kayıtlı tarama yok.</Card>
            ) : (
              <Card className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt text-left text-xs font-bold uppercase tracking-wider text-muted">
                      <th className="p-3.5">Site</th>
                      <th className="p-3.5">Zaman</th>
                      <th className="p-3.5">Durum</th>
                      <th className="p-3.5 text-right">Bulunan</th>
                      <th className="p-3.5 text-right">Yazılan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {initialRuns.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-alt/60 transition-colors">
                        <td className="p-3.5 font-bold text-text">
                          {SITE_LABELS[r.siteName as SiteName] ?? r.siteName}
                        </td>
                        <td className="p-3.5 text-xs text-muted tabular-nums">
                          {new Date(r.startedAt).toLocaleString('tr-TR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              STATUS_STYLES[r.status] ?? 'bg-surface-alt text-muted'
                            }`}
                          >
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-xs text-text font-bold tabular-nums">
                          {r.productsFound}
                        </td>
                        <td className="p-3.5 text-right font-mono text-xs text-success font-bold tabular-nums">
                          {r.productsUpserted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Eşleşme İncelemeleri Sekmesi */
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-text">Bekleyen Ürün Eşleşmeleri</h2>
              <p className="text-sm text-muted">
                Otomatik eşleşme puanı limit sınırında kalan adaylar. Bu ürünler otomatik olarak birleştirilmedi.
              </p>
            </div>
            {/* Filtre Arayüzü */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Ürün adı veya neden ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-60 rounded-lg border border-border-strong bg-surface px-3 text-sm focus:border-primary focus:outline-none"
              />
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-sm font-medium focus:border-primary focus:outline-none"
              >
                <option value="all">Tüm Siteler</option>
                {Object.entries(SITE_LABELS).map(([site, label]) => (
                  <option key={site} value={site}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <Card className="p-8 text-center text-muted text-sm">
              Kriterlere uyan inceleme bekleyen eşleşme bulunamadı.
            </Card>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-alt text-left text-xs font-bold uppercase tracking-wider text-muted">
                    <th className="p-3.5">Site</th>
                    <th className="p-3.5">Ürün Başlığı</th>
                    <th className="p-3.5">Eşleşmeme Gerekçesi</th>
                    <th className="p-3.5 text-right">Skor</th>
                    <th className="p-3.5 text-right">Fiyat</th>
                    <th className="p-3.5">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredReviews.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-alt/60 transition-colors">
                      <td className="p-3.5 font-bold text-text">
                        {SITE_LABELS[r.siteName as SiteName] ?? r.siteName}
                      </td>
                      <td className="max-w-md p-3.5 text-text">
                        <a
                          href={r.productUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium hover:text-primary transition-colors hover:underline line-clamp-2"
                        >
                          {r.rawTitle}
                        </a>
                      </td>
                      <td className="p-3.5 text-xs text-muted font-medium">{r.reason}</td>
                      <td className="p-3.5 text-right">
                        <Badge
                          variant={r.score >= 0.85 ? 'cheapest' : r.score >= 0.7 ? 'info' : 'danger'}
                          className="font-mono tabular-nums"
                        >
                          {r.score > 0 ? r.score.toFixed(2) : '—'}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-text tabular-nums">
                        {formatPrice(r.price)}
                      </td>
                      <td className="p-3.5 text-xs text-muted tabular-nums">
                        {new Date(r.createdAt).toLocaleDateString('tr-TR', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
