'use client';

// recharts tarayıcıda çalışır; veri sunucudan serileştirilmiş props olarak gelir.

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { ChartRow } from '@/lib/history';
import { SITES, SITE_LABELS, type SiteName } from '@/lib/types';

// dataviz skill ile doğrulanmış kategorik palet (lightness/chroma/contrast PASS,
// all-pairs CVD ΔE 10.8 — floor bandı, mitigasyon: bu legend + tooltip + sayfadaki
// fiyat tablosu). globals.css'teki --color-site-* token'larıyla birebir aynı tutulmalı.
const LINE_COLORS: Record<SiteName, string> = {
  trendyol: '#2a78d6',
  hepsiburada: '#129166',
  amazon: '#4a3aa7',
  vatan: '#e34948',
  n11: '#c2531d',
};

// globals.css'teki nötr paletle birebir aynı; grafik beyaz kart üstünde durduğu
// için nokta konturu (eski PAPER rolü) beyazdır.
const HAIRLINE = '#e6e8ee';
const SLATE = '#66707f';
const CARD_BG = '#ffffff';

export default function PriceHistoryChart({ rows }: { rows: ChartRow[] }) {
  const activeSites = SITES.filter((s) => rows.some((r) => r[s] !== undefined));
  if (rows.length < 2) {
    return (
      <p className="rounded-lg bg-surface-alt p-4 text-sm text-muted">
        Fiyat geçmişi grafiği için henüz yeterli veri yok — scraper birkaç gün çalıştıktan sonra
        burada görünecek.
      </p>
    );
  }
  return (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={HAIRLINE} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: SLATE }}
            axisLine={{ stroke: HAIRLINE }}
            tickLine={false}
            tickFormatter={(d: string) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
          />
          <YAxis
            tick={{ fontSize: 12, fill: SLATE }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(v: number) => new Intl.NumberFormat('tr-TR').format(v) + ' ₺'}
          />
          <Tooltip
            contentStyle={{ borderColor: HAIRLINE, borderRadius: 8, fontSize: 13 }}
            formatter={(value) => new Intl.NumberFormat('tr-TR').format(Number(value)) + ' ₺'}
            labelFormatter={(d) => new Date(String(d)).toLocaleDateString('tr-TR')}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: SLATE }} />
          {activeSites.map((site) => (
            <Line
              key={site}
              type="monotone"
              dataKey={site}
              name={SITE_LABELS[site]}
              stroke={LINE_COLORS[site]}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: CARD_BG }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: CARD_BG }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
