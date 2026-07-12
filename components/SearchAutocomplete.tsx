'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchSuggestion } from '@/lib/types';
import { SearchIcon } from './ui/icons';
import { cx } from './ui/cx';
import { formatPrice } from '@/lib/normalize';

/**
 * Arama kutusu + otomatik tamamlama açılır listesi. /api/search/suggest'e
 * debounce'lu istek atar; klavye (ok/enter/esc) ve fareyle gezilir. Boş seçimle
 * Enter → /ara?q=..., bir öneri seçiliyken → /urun/[id].
 */
export default function SearchAutocomplete({
  placeholder = 'Ürün ara — örn. iPhone 15',
  className,
  inputClassName,
  autoFocus,
}: {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, { signal: ac.signal });
        const data = (await res.json()) as { suggestions: SearchSuggestion[] };
        setItems(data.suggestions ?? []);
        setActive(-1);
        setOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setItems([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function goSearch(term: string) {
    const t = term.trim();
    if (!t) return;
    setOpen(false);
    router.push(`/ara?q=${encodeURIComponent(t)}`);
  }

  function goProduct(id: number) {
    setOpen(false);
    router.push(`/urun/${id}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || items.length === 0) {
      if (e.key === 'Enter') goSearch(q);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0) goProduct(items[active].id);
      else goSearch(q);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted">
          <SearchIcon className="h-4.5 w-4.5" />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => items.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          aria-label="Ürün ara"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          className={cx(
            'h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-body-sm text-text transition-all duration-200',
            'placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none shadow-sm',
            inputClassName,
          )}
        />
      </div>

      {open && (items.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-premium">
          {items.length === 0 && loading ? (
            <p className="px-4 py-3 text-body-sm text-muted">Aranıyor…</p>
          ) : (
            <ul id="search-suggestions" role="listbox" className="max-h-[70vh] overflow-y-auto scrollbar-thin py-1.5">
              {items.map((it, i) => (
                <li key={it.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => goProduct(it.id)}
                    className={cx(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      i === active ? 'bg-primary-soft' : 'hover:bg-slate-50',
                    )}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element -- harici CDN görselleri */}
                      <img
                        src={it.imageUrl ?? '/placeholder.svg'}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-sm font-medium text-text">{it.name}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-caption text-muted">
                        {it.price != null && (
                          <span className="font-mono font-semibold text-success">{formatPrice(it.price)}</span>
                        )}
                        {it.siteCount > 1 && <span>{it.siteCount} mağaza</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              <li className="border-t border-border/60">
                <button
                  type="button"
                  onClick={() => goSearch(q)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-body-sm font-semibold text-primary hover:bg-primary-soft"
                >
                  <SearchIcon className="h-4 w-4" />
                  &ldquo;{q.trim()}&rdquo; için tüm sonuçları gör
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
