import Card from '@/components/ui/Card';

/** Ürün detay iskeleti: hero (görsel + başlık/fiyat) ve fiyat listesi satırları. */
export default function ProductLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      <div className="h-4 w-64 rounded-full bg-border/70" />
      <section className="grid grid-cols-1 gap-6 rounded-3xl border border-border bg-surface p-6 shadow-premium md:grid-cols-[240px_1fr] md:gap-8">
        <div className="h-56 rounded-2xl bg-border/40 md:h-full" />
        <div className="flex flex-col justify-center gap-4">
          <div className="h-7 w-4/5 rounded-lg bg-border/60" />
          <div className="h-7 w-3/5 rounded-lg bg-border/40" />
          <div className="h-12 w-56 rounded-lg bg-border/50" />
          <div className="h-6 w-72 rounded-full bg-border/30" />
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <div className="h-6 w-44 rounded-full bg-border/60" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-16 bg-border/20" />
        ))}
      </section>
    </div>
  );
}
