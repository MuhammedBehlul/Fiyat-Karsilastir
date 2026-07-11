'use client';

import { useState } from 'react';

/**
 * Filtre panelindeki bir onay kutusu grubu (Marka, Depolama, Renk...).
 * Durum tutmaz — seçimler URL'den gelir, değişiklik üst bileşene bildirilir.
 */
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export default function FilterCheckboxGroup({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (options.length === 0) return null;

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const hasMore = options.length > 6;
  // If expanded, show all. Otherwise show first 5 options.
  const visibleOptions = expanded || !hasMore ? options : options.slice(0, 5);

  return (
    <fieldset className="border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-2.5 text-body-sm font-semibold text-text">{title}</legend>
      <div className="flex flex-col gap-1 pr-1">
        {visibleOptions.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-body-sm text-text transition-colors hover:bg-primary-soft"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                className="h-4 w-4 shrink-0 accent-primary"
              />
              <span className="flex-1 truncate">{opt.label}</span>
              {opt.count != null && (
                <span className="shrink-0 font-mono text-caption tabular-nums text-muted">{opt.count}</span>
              )}
            </label>
          );
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 px-1.5 py-1 text-caption font-bold text-primary hover:text-primary-strong transition-colors flex items-center gap-1 cursor-pointer select-none"
        >
          {expanded ? (
            <>
              Daha Az Göster
              <svg className="h-3 w-3 rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </>
          ) : (
            <>
              Tümünü Göster ({options.length})
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </fieldset>
  );
}
