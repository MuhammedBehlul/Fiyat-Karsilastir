import Card from '@/components/ui/Card';

/** Kategori sayfası iskeleti: gerçek yerleşimle aynı ızgara, nabız animasyonu. */
export default function CategoryLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-4 w-40 rounded-full bg-border/70" />
      <header className="border-b border-border/60 pb-5">
        <div className="h-3 w-16 rounded-full bg-border/70" />
        <div className="mt-2 h-8 w-48 rounded-lg bg-border/70" />
        <div className="mt-2 h-4 w-72 rounded-full bg-border/50" />
      </header>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card className="hidden w-64 shrink-0 p-4 lg:block">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-4 w-24 rounded-full bg-border/70" />
                <div className="h-3 w-full rounded-full bg-border/40" />
                <div className="h-3 w-4/5 rounded-full bg-border/40" />
              </div>
            ))}
          </div>
        </Card>
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
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
    </div>
  );
}
