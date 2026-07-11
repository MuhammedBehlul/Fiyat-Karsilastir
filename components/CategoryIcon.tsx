// Kategori kartları ve mega menü için slug bazlı ikon seti.
// Proje ikon kütüphanesi kullanmıyor; bilinmeyen bir slug gelirse (kategori
// büyüdükçe kaçınılmaz) jenerik bir fiyat etiketi ikonuna düşer.

const ICONS: Record<string, (className: string) => React.ReactNode> = {
  telefon: (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={c}>
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
      <path d="M11 18.5h2" strokeLinecap="round" />
    </svg>
  ),
  bilgisayar: (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={c}>
      <rect x="3.5" y="4" width="17" height="11" rx="1.5" />
      <path d="M2 19.5h20M9.5 15v2.5M14.5 15v2.5" strokeLinecap="round" />
    </svg>
  ),
  laptop: (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={c}>
      <rect x="4.5" y="4.5" width="15" height="10.5" rx="1.5" />
      <path d="M2.5 19h19l-2-4h-15Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  kulaklik: (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={c}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" strokeLinecap="round" />
      <rect x="3" y="14" width="4" height="6.5" rx="1.6" />
      <rect x="17" y="14" width="4" height="6.5" rx="1.6" />
    </svg>
  ),
  'ev-aletleri': (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={c}>
      <path d="M8 3.5v4M8 3.5c2.2 0 2.2 2 4.4 2s2.2-2 4.4-2M8 3.5c-1.2 1.4-1.2 2.6 0 4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="9.5" width="12" height="11" rx="2" />
      <circle cx="12" cy="15" r="2.6" />
    </svg>
  ),
  moda: (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={c}>
      <path
        d="M9 3.5 5 6.2 3 9.5l2.6 1.8L7 10v10.5h10V10l1.4 1.3L21 9.5 19 6.2 15 3.5c0 1.9-1.3 3-3 3s-3-1.1-3-3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  oyun: (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={c}>
      <path
        d="M6.5 8.5h11a4 4 0 0 1 3.9 4.9l-.7 3a2.6 2.6 0 0 1-4.6 1L14 15.5h-4l-2.1 1.9a2.6 2.6 0 0 1-4.6-1l-.7-3a4 4 0 0 1 3.9-4.9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 10.8v2.6M6.7 12.1h2.6M16 11h.01M18 13h.01" strokeLinecap="round" />
    </svg>
  ),
  'kisisel-bakim': (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={c}>
      <path
        d="M12 20.5s-7.2-4.4-9.2-9C1 7.9 2.6 5 5.6 4.3c2-.4 3.7.5 4.7 2a5.6 5.6 0 0 1 1.7 2 5.6 5.6 0 0 1 1.7-2c1-1.5 2.7-2.4 4.7-2 3 .7 4.6 3.6 2.8 7.2-2 4.6-9.2 9-9.2 9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const FALLBACK = (c: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={c}>
    <path
      d="M20 12.3 12.7 19.6a1.8 1.8 0 0 1-2.5 0l-6.3-6.3a1.8 1.8 0 0 1-.5-1.3V5a1 1 0 0 1 1-1h7a1.8 1.8 0 0 1 1.3.5l7.3 7.3a1.8 1.8 0 0 1 0 2.5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export default function CategoryIcon({ slug, className = 'h-6 w-6' }: { slug: string; className?: string }) {
  const render = ICONS[slug] ?? FALLBACK;
  return render(className);
}
