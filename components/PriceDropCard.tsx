import Link from 'next/link';
import type { PriceDrop } from '@/lib/queries';
import Badge from './ui/Badge';
import Card from './ui/Card';
import PriceTag from './ui/PriceTag';

export default function PriceDropCard({ drop }: { drop: PriceDrop }) {
  return (
    <Card interactive className="group relative flex flex-col p-3">
      <Link href={`/urun/${drop.id}`} className="flex flex-1 flex-col">
        <Badge variant="discount" className="absolute right-4.5 top-4.5 z-10 shadow-md">
          −%{drop.percent.toFixed(0)}
        </Badge>
        <div className="flex h-36 items-center justify-center bg-slate-50/50 rounded-xl p-4 overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- görseller harici CDN'den geliyor */}
          <img
            src={drop.imageUrl ?? '/placeholder.svg'}
            alt={drop.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col gap-2 p-2 pt-3">
          <p
            title={drop.name}
            className="line-clamp-2 text-body-sm font-semibold text-text group-hover:text-primary transition-colors leading-snug"
          >
            {drop.name}
          </p>
          <div className="mt-1">
            <PriceTag price={drop.currentPrice} oldPrice={drop.previousPrice} tone="cheapest" size="md" />
          </div>
        </div>
      </Link>
    </Card>
  );
}
