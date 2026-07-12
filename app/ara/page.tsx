import ProductCard from '@/components/ProductCard';
import SortToggle from '@/components/SortToggle';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/Input';
import { searchProducts } from '@/lib/cached';
import { getFavoriteVariantIds } from '@/lib/accounts';
import { getCurrentUser } from '@/lib/currentUser';
import { parsePage } from '@/lib/filters';
import { sortByCheapestPrice } from '@/lib/normalize';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  // Arama sonucu sayfaları sonsuz sorgu permütasyonu üretir (ince/yinelenen içerik) — indekslenmesin.
  return { title: q ? `"${q}" için sonuçlar` : 'Arama', robots: { index: false, follow: true } };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { q = '', sort } = sp;
  const sortStr = typeof sort === 'string' ? sort : Array.isArray(sort) ? sort[0] : undefined;
  const page = parsePage(sp);

  const found = q ? await searchProducts(q).catch(() => []) : [];
  // Sıralama tüm sonuç listesinde yapılır, sayfa sonra dilimlenir — böylece
  // "ucuzdan pahalıya" 2. sayfada da tutarlı kalır.
  const results = sortStr === 'asc' || sortStr === 'desc'
    ? sortByCheapestPrice(found, sortStr)
    : found; // "En ilişkili" varsayılan arama sıralamasını koru
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const user = await getCurrentUser().catch(() => null);
  const favSet = user ? new Set(await getFavoriteVariantIds(user.id).catch(() => [])) : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-3xl bg-slate-50 border border-border p-6 shadow-sm">
        <h1 className="font-heading text-lg font-bold text-text mb-4">Yeni Arama Yapın</h1>
        <SearchInput
          defaultValue={q}
          placeholder="Ürün ara: iphone 15, galaxy a07..."
          aria-label="Ürün ara"
          required
        />
      </div>
      {q && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <span className="text-caption font-semibold uppercase tracking-wider text-muted">Arama Sonucu</span>
            <p className="text-body-sm text-muted mt-0.5">
              <strong className="text-text font-semibold">&ldquo;{q}&rdquo;</strong> için {results.length} ürün listelendi.
            </p>
          </div>
          {results.length > 1 && <SortToggle basePath="/ara" query={q} sort={sortStr} />}
        </div>
      )}
      {pageItems.length === 0 ? (
        <Card className="p-6 text-body-sm text-muted">
          {q
            ? 'Sonuç bulunamadı. Daha kısa ya da farklı kelimelerle deneyin (örn. sadece model adı).'
            : 'Aramak istediğiniz ürünü yazın.'}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageItems.map((p) => (
            <ProductCard key={p.id} product={p} favorite={favSet?.has(p.id) ?? false} />
          ))}
        </div>
      )}
      <Pagination basePath="/ara" searchParams={sp} page={page} totalPages={totalPages} />
    </div>
  );
}
