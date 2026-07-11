'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import FilterCheckboxGroup from './ui/FilterCheckboxGroup';
import PriceRangeInput from './ui/PriceRangeInput';
import { CloseIcon, FilterIcon } from './ui/icons';
import { capacityLabel, colorLabel, countActiveFilters, parseFilters } from '@/lib/filters';
import type { CategoryFacets } from '@/lib/types';

/**
 * Filtre paneli: masaüstünde yapışkan kenar çubuğu, mobilde alttan açılan
 * çekmece. Tek gerçek kaynağı URL'dir — kutucuk değişimi anında
 * router.replace ile yeni parametreleri yazar, sunucu bileşeni yeniden
 * veri çeker (gönder düğmesi yok). replace kullanılır ki hızlı kutu
 * tıklamaları tarayıcı geçmişini doldurmasın.
 */
export default function CategoryFilters({ facets }: { facets: CategoryFacets }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sp: Record<string, string | undefined> = Object.fromEntries(searchParams.entries());
  const filters = parseFilters(sp);
  const activeCount = countActiveFilters(filters);

  // Çekmece açıkken arkadaki sayfa kaymasın.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const update = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(searchParams);
    mutate(p);
    p.delete('page'); // her filtre değişikliği 1. sayfaya döner
    const qs = p.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const setList = (key: string, values: string[]) =>
    update((p) => {
      if (values.length > 0) p.set(key, values.join(','));
      else p.delete(key);
    });

  const panel = (
    <div className="flex flex-col gap-4">
      <FilterCheckboxGroup
        title="Marka"
        options={facets.brands.map((b) => ({ value: b.value, label: b.value, count: b.count }))}
        selected={filters.brand ?? []}
        onChange={(next) => setList('brand', next)}
      />
      <PriceRangeInput
        min={filters.minPrice ?? null}
        max={filters.maxPrice ?? null}
        bounds={{ min: facets.priceMin, max: facets.priceMax }}
        onChange={(min, max) =>
          update((p) => {
            if (min != null) p.set('min', String(min));
            else p.delete('min');
            if (max != null) p.set('max', String(max));
            else p.delete('max');
          })
        }
      />
      <FilterCheckboxGroup
        title="Depolama"
        options={facets.storageGb.map((s) => ({ value: String(s), label: capacityLabel(s) }))}
        selected={(filters.storageGb ?? []).map(String)}
        onChange={(next) => setList('storage', next)}
      />
      <FilterCheckboxGroup
        title="RAM"
        options={facets.ramGb.map((r) => ({ value: String(r), label: `${r} GB` }))}
        selected={(filters.ramGb ?? []).map(String)}
        onChange={(next) => setList('ram', next)}
      />
      <FilterCheckboxGroup
        title="Renk"
        options={facets.colors.map((c) => ({ value: c.slug, label: colorLabel(c.slug), count: c.count }))}
        selected={filters.color ?? []}
        onChange={(next) => setList('color', next)}
      />
      <fieldset className="border-t border-border/70 pt-4">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-body-sm text-text transition-colors hover:bg-primary-soft">
          <input
            type="checkbox"
            checked={Boolean(filters.comparableOnly)}
            onChange={(e) =>
              update((p) => {
                if (e.target.checked) p.set('comparable', '1');
                else p.delete('comparable');
              })
            }
            className="h-4 w-4 shrink-0 accent-primary"
          />
          <span className="flex-1">
            Yalnızca karşılaştırılabilir
            <span className="block text-caption text-muted">2+ mağazada fiyatı olanlar</span>
          </span>
        </label>
      </fieldset>
    </div>
  );

  return (
    <>
      {/* Mobil: çekmece tetikleyicisi */}
      <div className="lg:hidden">
        <Button variant="secondary" size="md" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen}>
          <FilterIcon className="h-4 w-4" />
          Filtrele
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-caption font-semibold tabular-nums text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobil: alttan açılan çekmece */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtreler">
          <button
            type="button"
            aria-label="Filtreleri kapat"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-text/40 backdrop-blur-[2px]"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-5 pb-8 shadow-premium">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-heading font-semibold text-text">Filtreler</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Kapat"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-text hover:bg-primary-soft"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            {panel}
            <Button variant="primary" size="lg" className="mt-5 w-full" onClick={() => setDrawerOpen(false)}>
              Sonuçları göster
            </Button>
          </div>
        </div>
      )}

      {/* Masaüstü: yapışkan kenar çubuğu */}
      <aside className="hidden w-64 shrink-0 lg:block sticky top-[88px] self-start max-h-[calc(100vh-110px)] overflow-y-auto pr-1.5 scrollbar-thin">
        <Card className="p-4">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-body font-semibold text-text">
            <FilterIcon className="h-4 w-4 text-muted" />
            Filtreler
          </h2>
          {panel}
        </Card>
      </aside>
    </>
  );
}
