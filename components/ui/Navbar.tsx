import Link from 'next/link';
import { getCategoryFacets, getFeaturedProducts } from '@/lib/cached';
import { CATEGORIES, type CategorySlug } from '@/lib/types';
import { SearchInput } from './Input';
import { CloseIcon, MenuIcon } from './icons';
import CategoryDropdown, { type CategoryMenuData } from './CategoryDropdown';


/*
 * Navbar: sticky, yarı saydam beyaz zemin. Geniş ekranda logo + kategori
 * mega menüsü + yardımcı linkler + arama; dar ekranda arama ikinci satıra
 * iner, linkler native <details> menüsünde (JS gerektirmez). Kategori
 * linkleri DB'ye gitmez — CATEGORIES sabiti tarama kapsamının kendisidir;
 * yalnızca mega menünün marka/ürün ÖNİZLEMESİ veri ister (aşağıda, cache'li).
 */
interface NavbarLink {
  label: string;
  href: string;
}

const UTILITY_LINKS: NavbarLink[] = [
  { label: 'İndirimdekiler', href: '/indirimdekiler' },
  { label: 'Nasıl çalışır', href: '/nasil-calisir' },
];

const MOBILE_LINKS: NavbarLink[] = [
  ...Object.entries(CATEGORIES).map(([slug, label]) => ({ label, href: `/kategori/${slug}` })),
  ...UTILITY_LINKS,
];

/**
 * Her kategori için mega menü önizlemesi: en popüler ~6 marka + 3 öne çıkan
 * ürün. getCategoryFacets/getFeaturedProducts zaten lib/cached'de sarılı
 * (kategori başına 1h cache) — CategoryWidgets aynı (limit, slug) argümanıyla
 * çağırdığında cache isabeti olur, burada ek bir sarmalayıcıya gerek yok.
 * Herhangi bir kategori başarısız olursa yalnızca o kategorinin önizlemesi
 * boş kalır (düz linke düşer) — tüm navbar'ı (=tüm sayfaları) etkilemez.
 */
async function loadMegaMenu(): Promise<CategoryMenuData[]> {
  const slugs = Object.keys(CATEGORIES) as CategorySlug[];
  return Promise.all(
    slugs.map(async (slug) => {
      const [facets, products] = await Promise.all([
        getCategoryFacets(slug).catch(() => null),
        getFeaturedProducts(3, slug).catch(() => []),
      ]);
      return {
        slug,
        name: CATEGORIES[slug],
        brands: facets?.brands.slice(0, 6).map((b) => b.value) ?? [],
        products,
      };
    }),
  );
}

export default async function Navbar() {
  const megaMenu = await loadMegaMenu().catch(() => []);
  const categoriesData = megaMenu.length > 0 
    ? megaMenu 
    : Object.entries(CATEGORIES).map(([slug, name]) => ({
        slug,
        name,
        brands: [],
        products: [],
      }));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 shadow-sm backdrop-blur-md transition-shadow duration-200">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-4 sm:px-6 lg:px-8 py-3.5 lg:flex-nowrap w-full">
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 font-heading text-lg font-bold tracking-tight text-text hover:opacity-90 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-blue-500 text-white shadow-md shadow-primary/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 3v18M12 5l7 3M12 5l-7 3M19 8c0 2.5-1.5 4.5-3.5 4.5S12 10.5 12 8M5 8c0 2.5 1.5 4.5 3.5 4.5S12 10.5 12 8" />
            </svg>
          </div>
          <span className="leading-none mt-0.5">
            Fiyat<span className="text-primary">Karşılaştır</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          <CategoryDropdown categories={categoriesData} />
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          {UTILITY_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl px-3.5 py-2 text-body-sm font-semibold text-text transition-all hover:bg-primary-soft hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="order-3 w-full min-w-0 lg:order-none lg:ml-auto lg:w-auto lg:max-w-xs lg:flex-1">
          <SearchInput placeholder="Ürün ara — örn. iPhone 15" aria-label="Ürün ara" />
        </div>

        {/*
          Gelecekteki hesap/favoriler/fiyat alarmı ikonları için ayrılmış alan.
          Bugün hiçbir kullanıcı hesabı/bildirim özelliği yok; boş, işlevsiz
          ikon eklenmedi. Bir özellik geldiğinde: components/ui/icons.tsx'e
          named export ekle, burada <Button variant="ghost" size="sm"> ile
          SearchInput'tan SONRA, mobil hamburger'dan ÖNCE yerleştir.
        */}

        {/* Dar ekran menüsü: native disclosure, client JS yok */}
        <details className="group relative order-2 ml-auto lg:hidden">
          <summary
            className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-text hover:bg-primary-soft [&::-webkit-details-marker]:hidden"
            aria-label="Menü"
          >
            <MenuIcon className="h-5 w-5 group-open:hidden" />
            <CloseIcon className="hidden h-5 w-5 group-open:block" />
          </summary>
          <nav className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-surface py-2 shadow-lg max-h-[75vh] overflow-y-auto scrollbar-thin">
            {MOBILE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-4 py-2.5 text-body-sm font-medium text-text hover:bg-primary-soft hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
