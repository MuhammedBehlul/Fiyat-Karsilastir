import ProductCard from '@/components/ProductCard';
import CategoryTabs from '@/components/CategoryTabs';
import PriceDropSection from '@/components/PriceDropSection';
import Card from '@/components/ui/Card';
import { getCatalogStats, getCategories, getFeaturedProducts } from '@/lib/cached';
import { getFavoriteVariantIds } from '@/lib/accounts';
import { getCurrentUser } from '@/lib/currentUser';
import { SITES, CATEGORY_GROUPS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [stats, categories, featured, user] = await Promise.all([
    getCatalogStats().catch(() => ({ productCount: 0 })),
    getCategories().catch(() => []),
    getFeaturedProducts(12).catch(() => []),
    getCurrentUser().catch(() => null),
  ]);
  const favSet = user ? new Set(await getFavoriteVariantIds(user.id).catch(() => [])) : null;

  // Kategori gruplama mantığı (tablar için)
  const groupedCategories = Object.entries(CATEGORY_GROUPS).map(([groupSlug, groupInfo]) => {
    const matchingCategories = categories.filter((c) =>
      (groupInfo.categories as readonly string[]).includes(c.slug)
    );
    return {
      groupSlug,
      groupLabel: groupInfo.label as string,
      categories: matchingCategories,
    };
  }).filter((g) => g.categories.length > 0);

  // Gruplara dahil edilmemiş kategoriler varsa Diğer altına topla
  const groupedSlugs = new Set<string>(Object.values(CATEGORY_GROUPS).flatMap((g) => g.categories));
  const otherCategories = categories.filter((c) => !groupedSlugs.has(c.slug));
  if (otherCategories.length > 0) {
    groupedCategories.push({
      groupSlug: 'other',
      groupLabel: 'Diğer',
      categories: otherCategories,
    });
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-6 py-12 text-white shadow-xl sm:px-12 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_45%)]" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md border border-white/5 uppercase tracking-wider">
            ⚡ Türkiye Genelinde Fiyat Takibi
          </span>
          <h1 className="mt-6 max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-5xl leading-tight">
            Aradığın Ürünün <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">En Ucuzunu</span> Hemen Bul
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base leading-relaxed">
            5 farklı mağazayı saniyeler içinde tara, fiyat geçmişini gör ve tasarruf et.
          </p>

          {/* Big search bar */}
          <div className="mt-8 w-full max-w-2xl">
            <form action="/ara" role="search" className="relative flex items-center">
              <div className="relative w-full">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-5 w-5">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.8-3.8" />
                  </svg>
                </span>
                <input
                  type="search"
                  name="q"
                  placeholder="Ürün adı veya model ara... Örn: iPhone 15"
                  autoComplete="off"
                  required
                  className="h-14 w-full rounded-2xl border border-white/15 bg-white/10 pl-12 pr-28 text-white placeholder:text-slate-400 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-lg backdrop-blur-md transition-all duration-300 text-base"
                />
              </div>
              <button
                type="submit"
                className="absolute right-2 h-10 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-strong transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 shadow-md shadow-primary/20"
              >
                Ara
              </button>
            </form>
          </div>

          {/* Tracked Store Logos Row */}
          <div className="mt-6 flex flex-wrap justify-center items-center gap-2.5 text-xs text-slate-400">
            <span className="mr-1.5 font-medium">Taranan Mağazalar:</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/5 px-2.5 py-1 text-white hover:bg-white/10 transition-colors">
              <span className="h-2 w-2 rounded-full bg-[#f27a1a]" /> Trendyol
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/5 px-2.5 py-1 text-white hover:bg-white/10 transition-colors">
              <span className="h-2 w-2 rounded-full bg-[#ff6000]" /> Hepsiburada
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/5 px-2.5 py-1 text-white hover:bg-white/10 transition-colors">
              <span className="h-2 w-2 rounded-full bg-[#ff9900]" /> Amazon
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/5 px-2.5 py-1 text-white hover:bg-white/10 transition-colors">
              <span className="h-2 w-2 rounded-full bg-[#005ca7]" /> Vatan
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/5 px-2.5 py-1 text-white hover:bg-white/10 transition-colors">
              <span className="h-2 w-2 rounded-full bg-[#e11d48]" /> N11
            </span>
          </div>

          {/* Stats Glassmorphism Box */}
          <div className="mt-12 w-full border-t border-white/10 pt-8">
            <dl className="grid grid-cols-3 gap-6 max-w-xl mx-auto">
              <div className="flex flex-col items-center bg-white/5 rounded-xl p-3.5 border border-white/5 backdrop-blur-sm">
                <dt className="text-caption text-slate-400">Takip Edilen</dt>
                <dd className="mt-1 font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
                  {stats.productCount}
                </dd>
              </div>
              <div className="flex flex-col items-center bg-white/5 rounded-xl p-3.5 border border-white/5 backdrop-blur-sm">
                <dt className="text-caption text-slate-400">Mağaza</dt>
                <dd className="mt-1 font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
                  {SITES.length}
                </dd>
              </div>
              <div className="flex flex-col items-center bg-white/5 rounded-xl p-3.5 border border-white/5 backdrop-blur-sm">
                <dt className="text-caption text-slate-400">Güncelleme</dt>
                <dd className="mt-1 font-heading text-lg font-bold text-white leading-8">
                  Günlük
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-heading text-heading font-semibold text-text">Kategoriler</h2>
        <CategoryTabs groups={groupedCategories} />
      </section>

      <PriceDropSection />

      <section>
        <h2 className="mb-4 font-heading text-heading font-semibold text-text">
          Karşılaştırılabilir ürünler
        </h2>
        {featured.length === 0 ? (
          <Card className="p-6 text-body-sm text-muted">
            Henüz veri yok. Scraper ilk kez çalıştıktan sonra birden çok sitede bulunan ürünler
            burada listelenecek.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} favorite={favSet?.has(p.id) ?? false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
