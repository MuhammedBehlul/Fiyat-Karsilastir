import Card from '@/components/ui/Card';

/** Arama sayfası iskeleti: arama kutusu + sonuç ızgarası. */
export default function SearchLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      <div className="h-32 rounded-3xl border border-border bg-border/30" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="flex flex-col p-2.5">
            <div className="h-44 rounded-2xl bg-border/40" />
            <div className="flex flex-col gap-2.5 p-4">
              <div className="h-4 w-full rounded-full bg-border/60" />
              <div className="h-4 w-2/3 rounded-full bg-border/40" />
              <div className="mt-2 h-10 rounded-lg bg-border/30" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
