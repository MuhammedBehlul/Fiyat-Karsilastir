import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ActiveFilterChips from '@/components/ui/ActiveFilterChips';
import Pagination from '@/components/ui/Pagination';
import Card from '@/components/ui/Card';
import CategoryFilters from '@/components/CategoryFilters';
import CategoryWidgets from '@/components/CategoryWidgets';
import ProductCard from '@/components/ProductCard';
import SortSelect from '@/components/SortSelect';
import { getCategories, getCategoryFacets } from '@/lib/cached';
import { getFavoriteVariantIds } from '@/lib/accounts';
import { getCurrentUser } from '@/lib/currentUser';
import { getProductsByCategory } from '@/lib/queries';
import { hasActiveFilters, parseFilters, parsePage, parseSort, type SearchParamsRecord } from '@/lib/filters';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import type { CategoryFacets } from '@/lib/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  const facets = await getCategoryFacets(slug).catch(() => null);
  return {
    title: `${category.name} Fiyatları — Karşılaştır ve En Ucuzunu Bul`,
    description: `${category.name} kategorisinde ${facets?.totalCount ?? 0} ürünün Trendyol, Hepsiburada, Amazon, Vatan Bilgisayar ve N11 fiyatlarını karşılaştırın, en uygun fiyatı anında bulun.`,
    // Filtre/sıralama/sayfa permütasyonları ayrı sayfa olarak indekslenmesin.
    alternates: { canonical: `/kategori/${slug}` },
  };
}

const EMPTY_FACETS: CategoryFacets = {
  totalCount: 0,
  comparableCount: 0,
  brands: [],
  storageGb: [],
  ramGb: [],
  colors: [],
  priceMin: null,
  priceMax: null,
};

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsRecord>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const categories = await getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const filters = parseFilters(sp);
  const sort = parseSort(sp);
  const page = parsePage(sp);
  const filtered = hasActiveFilters(filters);
  const showWidgets = !filtered && sort === 'popular' && page === 1;

  const [facets, { items: products, total }] = await Promise.all([
    getCategoryFacets(slug).catch(() => EMPTY_FACETS),
    getProductsByCategory(slug, { filters, sort, page, pageSize: PAGE_SIZE }).catch(() => ({
      items: [],
      total: 0,
    })),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath = `/kategori/${slug}`;
  const breadcrumbItems = [{ label: 'Ana Sayfa', href: '/' }, { label: category.name }];

  const user = await getCurrentUser().catch(() => null);
  const favSet = user ? new Set(await getFavoriteVariantIds(user.id).catch(() => [])) : null;

  return (
    <div className="flex flex-col gap-6">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <Breadcrumb items={breadcrumbItems} />

      <header className="border-b border-border/60 pb-5">
        <span className="text-caption font-semibold uppercase tracking-wider text-muted">Kategori</span>
        <h1 className="mt-0.5 font-heading text-title font-extrabold text-text sm:text-display">
          {category.name}
        </h1>
        {facets.totalCount > 0 && (
          <p className="mt-1.5 text-body-sm text-muted">
            <span className="font-mono font-semibold tabular-nums text-text">{facets.totalCount}</span> üründen{' '}
            <span className="font-mono font-semibold tabular-nums text-success">{facets.comparableCount}</span>
            &apos;i 2+ mağazada karşılaştırılıyor
          </p>
        )}
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <CategoryFilters facets={facets} />

        <div className="flex min-w-0 flex-1 flex-col gap-6 xl:flex-row xl:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
              <p className="text-body-sm text-muted">
                <span className="font-mono font-semibold tabular-nums text-text">{total}</span> sonuç
              </p>
              <SortSelect basePath={basePath} searchParams={sp} sort={sort} />
            </div>

            <ActiveFilterChips basePath={basePath} searchParams={sp} />

            {products.length === 0 ? (
              <Card className="p-8 text-center text-body-sm text-muted">
                {facets.totalCount === 0 ? (
                  'Bu kategoride henüz ürün yok — günlük tarama sonrası tekrar deneyin.'
                ) : filtered ? (
                  <>
                    Seçtiğiniz filtrelere uygun ürün bulunamadı.{' '}
                    <Link href={basePath} className="font-medium text-primary underline-offset-2 hover:underline">
                      Filtreleri temizle
                    </Link>
                  </>
                ) : (
                  'Bu sayfada gösterilecek ürün yok.'
                )}
              </Card>
            ) : (
              <div
                className={
                  showWidgets
                    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'
                    : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }
              >
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} favorite={favSet?.has(p.id) ?? false} />
                ))}
              </div>
            )}

            <Pagination basePath={basePath} searchParams={sp} page={page} totalPages={totalPages} />
          </div>

          {showWidgets && (
            <aside className="w-full shrink-0 xl:w-[320px] xl:sticky xl:top-[88px] xl:self-start">
              <CategoryWidgets categorySlug={slug} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
