'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { ProductWithPrices } from '@/lib/types';
import { GridIcon, ChevronDownIcon } from './icons';
import { cx } from './cx';

export interface CategoryMenuData {
  slug: string;
  name: string;
  brands: string[];
  products: ProductWithPrices[];
}

interface CategoryDropdownProps {
  categories: CategoryMenuData[];
}

export default function CategoryDropdown({ categories }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set the first category as active by default if not set
  useEffect(() => {
    if (categories.length > 0 && !activeSlug) {
      setActiveSlug(categories[0].slug);
    }
  }, [categories, activeSlug]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // slight delay to prevent accidental closing
  };

  const activeCategory = categories.find((cat) => cat.slug === activeSlug) || categories[0];

  return (
    <div
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cx(
          "flex items-center gap-2 rounded-xl border px-4 py-2 text-body-sm font-semibold transition-all duration-200 cursor-pointer select-none",
          isOpen
            ? "border-primary bg-primary-soft text-primary shadow-sm"
            : "border-border bg-surface text-text shadow-sm hover:border-primary/45 hover:bg-primary-soft/30 hover:text-primary"
        )}
      >
        <GridIcon className="h-4.5 w-4.5" />
        <span>Kategoriler</span>
        <ChevronDownIcon
          className={cx(
            "h-4 w-4 text-muted transition-transform duration-250",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>

      {isOpen && categories.length > 0 && (
        <div 
          className="absolute left-0 top-full z-50 pt-2 w-[48rem]"
          role="menu"
        >
          <div className="flex flex-col rounded-2xl border border-border bg-surface shadow-premium p-4 gap-3 overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150">
            <div className="flex gap-4">
              {/* Left Side: Categories Scrollable List */}
              <div className="w-56 border-r border-border/60 pr-2 max-h-[380px] overflow-y-auto scrollbar-thin flex flex-col gap-1">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/kategori/${cat.slug}`}
                    onMouseEnter={() => setActiveSlug(cat.slug)}
                    onClick={() => setIsOpen(false)}
                    className={cx(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-body-sm font-medium transition-all",
                      activeSlug === cat.slug
                        ? "bg-primary-soft text-primary font-semibold"
                        : "text-text hover:bg-slate-50"
                    )}
                    role="menuitem"
                  >
                    <span>{cat.name}</span>
                    <svg
                      className={cx(
                        "h-3.5 w-3.5 transition-transform",
                        activeSlug === cat.slug ? "text-primary translate-x-0.5" : "text-muted opacity-60"
                      )}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>

              {/* Right Side: Category Preview Panels */}
              <div className="flex-1 min-w-0 max-h-[380px] overflow-y-auto overflow-x-hidden pr-1">
                {activeCategory ? (
                  <div className="grid grid-cols-[1fr_1.25fr] gap-6 p-1 h-full">
                    {/* Brands Column */}
                    <div className="flex flex-col">
                      <h4 className="mb-2.5 font-heading text-caption font-bold uppercase tracking-wider text-muted">
                        Popüler Markalar
                      </h4>
                      {activeCategory.brands.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {activeCategory.brands.map((brand) => (
                            <Link
                              key={brand}
                              href={`/kategori/${activeCategory.slug}?brand=${encodeURIComponent(brand)}`}
                              onClick={() => setIsOpen(false)}
                              className="rounded-lg px-2.5 py-2 text-body-sm text-text transition-colors hover:bg-primary-soft hover:text-primary font-medium"
                            >
                              {brand}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-body-sm text-muted px-2.5 py-2">Bu kategori için marka verisi yok</span>
                      )}
                    </div>

                    {/* Featured Products Column */}
                    <div className="flex flex-col border-l border-border/40 pl-5">
                      <h4 className="mb-2.5 font-heading text-caption font-bold uppercase tracking-wider text-muted">
                        Öne Çıkanlar
                      </h4>
                      {activeCategory.products.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {activeCategory.products.map((p) => (
                            <Link
                              key={p.id}
                              href={`/urun/${p.id}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 border border-transparent hover:border-border/30"
                            >
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white border border-slate-100 p-1">
                                {/* eslint-disable-next-line @next/next/no-img-element -- external product images */}
                                <img
                                  src={p.imageUrl ?? '/placeholder.svg'}
                                  alt=""
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block truncate text-body-sm font-semibold text-text mb-0.5">{p.name}</span>
                                {p.prices[0] && (
                                  <span className="text-caption font-mono font-bold text-success">
                                    {p.prices[0].price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 })}
                                  </span>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-body-sm text-muted px-2">Öne çıkan ürün bulunmuyor</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-body-sm text-muted py-10">
                    Kategori seçilmedi
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer Action */}
            {activeCategory && (
              <div className="mt-2 border-t border-border/50 pt-3.5 flex justify-end">
                <Link
                  href={`/kategori/${activeCategory.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="text-body-sm font-bold text-primary hover:text-primary-strong transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-primary-soft/50"
                >
                  Tüm {activeCategory.name} Ürünlerini Gör
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
