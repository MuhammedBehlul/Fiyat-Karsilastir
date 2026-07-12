import Link from 'next/link';
import { redirect } from 'next/navigation';
import AlertForm from '@/components/AlertForm';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Card from '@/components/ui/Card';
import { buttonClasses } from '@/components/ui/Button';
import { getUserAlerts } from '@/lib/accounts';
import { getCurrentUser } from '@/lib/currentUser';
import { formatPrice } from '@/lib/normalize';
import { getCheapestPrices, getProductsByIds } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Fiyat alarmlarım', robots: { index: false } };

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/giris?next=/alarmlarim');

  const alerts = await getUserAlerts(user.id).catch(() => []);
  const ids = alerts.map((a) => a.variantId);
  const [products, cheapest] = await Promise.all([
    getProductsByIds(ids).catch(() => []),
    getCheapestPrices(ids).catch(() => new Map<number, number>()),
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Ana Sayfa', href: '/' }, { label: 'Fiyat alarmlarım' }]} />
      <header className="border-b border-border/60 pb-5">
        <h1 className="font-heading text-title font-extrabold text-text sm:text-display">Fiyat alarmlarım</h1>
        <p className="mt-1.5 text-body-sm text-muted">
          Bir ürünün fiyatı belirlediğin hedefin altına düştüğünde e-posta göndeririz.
        </p>
      </header>

      {alerts.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-body text-muted">Henüz fiyat alarmın yok.</p>
          <p className="text-body-sm text-muted">
            Bir ürün sayfasında hedef fiyatını belirleyerek alarm kurabilirsin.
          </p>
          <Link href="/" className={buttonClasses('primary', 'md')}>Ürünleri keşfet</Link>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {alerts.map((alert) => {
            const product = productById.get(alert.variantId);
            const current = cheapest.get(alert.variantId) ?? null;
            const reached = current != null && current <= alert.targetPrice;
            return (
              <li key={alert.variantId}>
                <Card className="flex flex-col gap-4 p-4 sm:p-5">
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/urun/${alert.variantId}`}
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border bg-slate-50/50 p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- harici CDN görselleri */}
                      <img
                        src={product?.imageUrl ?? '/placeholder.svg'}
                        alt={product?.name ?? ''}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/urun/${alert.variantId}`} className="line-clamp-2 text-body-sm font-semibold text-text hover:text-primary">
                        {product?.name ?? `Ürün #${alert.variantId}`}
                      </Link>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-muted">
                        <span>
                          Güncel: <span className="font-mono font-semibold tabular-nums text-text">{current != null ? formatPrice(current) : '—'}</span>
                        </span>
                        <span>
                          Hedef: <span className="font-mono font-semibold tabular-nums text-primary">{formatPrice(alert.targetPrice)}</span>
                        </span>
                        {reached && (
                          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                            Hedefe ulaşıldı
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <AlertForm
                    variantId={alert.variantId}
                    currentPrice={current}
                    initialTarget={alert.targetPrice}
                    loggedIn
                  />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
