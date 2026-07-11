'use client';

import { useMemo, useState } from 'react';
import type { PriceDrop } from '@/lib/queries';
import PriceDropCard from './PriceDropCard';
import Card from './ui/Card';
import { CATEGORIES } from '@/lib/types';
import CategoryChip from './ui/CategoryChip';

export default function DiscountsFilterView({ initialDrops }: { initialDrops: PriceDrop[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'percent' | 'price'>('percent');

  // Her kategori için indirimli ürün sayıları (ilk durumdaki filtrelenmemiş sayıları yansıtır)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialDrops.length };
    for (const slug of Object.keys(CATEGORIES)) {
      counts[slug] = 0;
    }
    for (const d of initialDrops) {
      if (d.categorySlug && d.categorySlug in counts) {
        counts[d.categorySlug]++;
      }
    }
    return counts;
  }, [initialDrops]);

  // Filtreleme ve sıralama mantığı
  const filteredDrops = useMemo(() => {
    let result = [...initialDrops];

    // 1) Kategori filtresi
    if (activeCategory !== 'all') {
      result = result.filter((d) => d.categorySlug === activeCategory);
    }

    // 2) Arama filtresi
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((d) => d.name.toLowerCase().includes(q));
    }

    // 3) Sıralama
    if (sortBy === 'percent') {
      result.sort((a, b) => b.percent - a.percent);
    } else if (sortBy === 'price') {
      result.sort((a, b) => a.currentPrice - b.currentPrice);
    }

    return result;
  }, [initialDrops, activeCategory, searchQuery, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      {/* Arama, Filtre ve Sıralama Barı */}
      <div className="flex flex-col gap-4 rounded-3xl bg-slate-50 border border-border/80 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Arama Girişi */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-4 flex items-center text-muted">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <circle cx={11} cy={11} r={8} />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="İndirimler içinde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-2.5 text-body-sm shadow-xs focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-text transition-colors"
              aria-label="Aramayı temizle"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sıralama Seçenekleri */}
        <div className="flex items-center gap-2 text-body-sm shrink-0">
          <span className="text-muted font-medium">Sırala:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSortBy('percent')}
              className={`rounded-xl px-3.5 py-2 font-semibold transition-all border ${
                sortBy === 'percent'
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text hover:bg-slate-50'
              }`}
            >
              Düşüş Oranına Göre
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`rounded-xl px-3.5 py-2 font-semibold transition-all border ${
                sortBy === 'price'
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text hover:bg-slate-50'
              }`}
            >
              En Ucuz Fiyata Göre
            </button>
          </div>
        </div>
      </div>

      {/* Kategori Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <CategoryChip
          active={activeCategory === 'all'}
          onClick={() => setActiveCategory('all')}
          className="cursor-pointer"
        >
          Tümü ({categoryCounts.all})
        </CategoryChip>
        {Object.entries(CATEGORIES).map(([slug, label]) => {
          const count = categoryCounts[slug] ?? 0;
          return (
            <CategoryChip
              key={slug}
              active={activeCategory === slug}
              onClick={() => setActiveCategory(slug)}
              className="cursor-pointer"
            >
              {label} ({count})
            </CategoryChip>
          );
        })}
      </div>

      {/* İndirim Ürünleri Izgarası */}
      {filteredDrops.length === 0 ? (
        <Card className="p-8 text-center text-body-sm text-muted">
          {searchQuery
            ? 'Arama kriterlerinize uygun indirimli ürün bulunamadı.'
            : 'Bu kategoride henüz indirimde olan ürün bulunmuyor.'}
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredDrops.map((d) => (
            <PriceDropCard key={d.id} drop={d} />
          ))}
        </div>
      )}
    </div>
  );
}
