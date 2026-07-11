'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Min–Maks fiyat girişi. Yazarken her tuşta gezinme tetiklenmesin diye
 * ~400ms gecikmeyle üst bileşene bildirir; URL dışarıdan değişirse
 * (çip kaldırma, temizle) alanlar senkronlanır.
 */
export default function PriceRangeInput({
  min,
  max,
  bounds,
  onChange,
}: {
  min: number | null;
  max: number | null;
  bounds: { min: number | null; max: number | null };
  onChange: (min: number | null, max: number | null) => void;
}) {
  const [minText, setMinText] = useState(min?.toString() ?? '');
  const [maxText, setMaxText] = useState(max?.toString() ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // URL değişince (dış kaynaklı) yerel alanları eşitle.
  useEffect(() => {
    setMinText(min?.toString() ?? '');
    setMaxText(max?.toString() ?? '');
  }, [min, max]);

  const schedule = (nextMin: string, nextMax: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const parse = (s: string) => {
        const n = Number(s);
        return s !== '' && Number.isFinite(n) && n > 0 ? n : null;
      };
      onChange(parse(nextMin), parse(nextMax));
    }, 400);
  };

  const inputClasses =
    'h-10 w-full min-w-0 rounded-xl border border-border-strong bg-surface px-3 font-mono text-body-sm tabular-nums text-text placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <fieldset className="border-t border-border/70 pt-4">
      <legend className="mb-2.5 text-body-sm font-semibold text-text">Fiyat Aralığı (₺)</legend>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={minText}
          placeholder={bounds.min != null ? String(Math.floor(bounds.min)) : 'Min'}
          aria-label="En düşük fiyat"
          onChange={(e) => {
            setMinText(e.target.value);
            schedule(e.target.value, maxText);
          }}
          className={inputClasses}
        />
        <span aria-hidden className="text-muted">
          —
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={maxText}
          placeholder={bounds.max != null ? String(Math.ceil(bounds.max)) : 'Maks'}
          aria-label="En yüksek fiyat"
          onChange={(e) => {
            setMaxText(e.target.value);
            schedule(minText, e.target.value);
          }}
          className={inputClasses}
        />
      </div>
    </fieldset>
  );
}
