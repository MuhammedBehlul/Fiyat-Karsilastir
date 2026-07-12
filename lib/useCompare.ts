'use client';

// Karşılaştırma seçimi — localStorage'da tutulur, bileşenler arası özel olay ile
// senkronize edilir (ürün kartındaki düğme + alttaki tepsi + /karsilastir sayfası
// aynı listeyi paylaşır). Sunucu bilmez; URL (?ids=) paylaşılabilir kaynaktır,
// CompareSync sayfadaki URL'i localStorage'a yansıtır.

import { useSyncExternalStore } from 'react';
import { COMPARE_MAX } from './compare';

const KEY = 'fk_compare';
const EVENT = 'fk-compare-change';
export { COMPARE_MAX };

const EMPTY: number[] = [];
let cachedStr = '';
let cached: number[] = EMPTY;

function parse(str: string): number[] {
  try {
    const v = JSON.parse(str);
    return Array.isArray(v) ? v.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): number[] {
  if (typeof window === 'undefined') return EMPTY;
  const str = localStorage.getItem(KEY) ?? '[]';
  if (str !== cachedStr) {
    cachedStr = str;
    cached = parse(str);
  }
  return cached;
}

function write(ids: number[]) {
  const deduped = [...new Set(ids)].slice(0, COMPARE_MAX);
  localStorage.setItem(KEY, JSON.stringify(deduped));
  window.dispatchEvent(new Event(EVENT));
}

export function toggleCompare(id: number) {
  const ids = getSnapshot();
  if (ids.includes(id)) write(ids.filter((x) => x !== id));
  else if (ids.length < COMPARE_MAX) write([...ids, id]);
}

export function removeCompare(id: number) {
  write(getSnapshot().filter((x) => x !== id));
}

export function clearCompare() {
  write([]);
}

/** URL kaynaklı id listesini localStorage'a yansıtır (CompareSync kullanır). */
export function setCompare(ids: number[]) {
  const current = getSnapshot();
  const next = [...new Set(ids)].slice(0, COMPARE_MAX);
  if (current.length === next.length && current.every((v, i) => v === next[i])) return;
  write(next);
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useCompare(): number[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
