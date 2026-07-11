import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { ReactNode } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CategoryChip from '@/components/ui/CategoryChip';
import Input, { SearchInput } from '@/components/ui/Input';
import PriceTag from '@/components/ui/PriceTag';
import { SearchIcon, TrendDownIcon } from '@/components/ui/icons';

export const metadata: Metadata = {
  title: 'Tasarım Sistemi',
  robots: { index: false, follow: false },
};

/* Yalnızca geliştirme amaçlı showcase — prod build'de 404 döner. */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-border pb-2 font-heading text-heading font-semibold text-text">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ name, cls, note }: { name: string; cls: string; note?: string }) {
  return (
    <div className="w-36">
      <div className={`h-14 rounded-lg border border-border ${cls}`} />
      <p className="mt-1.5 font-mono text-caption text-text">{name}</p>
      {note && <p className="text-caption text-muted">{note}</p>}
    </div>
  );
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-heading text-title font-bold text-text md:text-display">
          Tasarım Sistemi
        </h1>
        <p className="mt-2 max-w-2xl text-body text-muted">
          Faz 1 showcase — tüm sayfalar yalnızca bu token ve bileşenlerle inşa edilecek. Bu sayfa
          prod build&apos;e dahil edilmez.
        </p>
      </div>

      <Section title="Renk paleti">
        <div className="flex flex-wrap gap-4">
          <Swatch name="primary" cls="bg-primary" note="Tek vurgu: link, CTA, aktif" />
          <Swatch name="primary-strong" cls="bg-primary-strong" note="hover / active" />
          <Swatch name="primary-soft" cls="bg-primary-soft" note="açık zemin" />
          <Swatch name="accent" cls="bg-accent" note="indirim rozeti" />
          <Swatch name="success" cls="bg-success" note="en ucuz, fiyat düşüşü" />
          <Swatch name="success-soft" cls="bg-success-soft" note="en ucuz zemin" />
          <Swatch name="danger" cls="bg-danger" note="fiyat yükselişi, hata" />
          <Swatch name="surface" cls="bg-surface" note="kart zemini" />
          <Swatch name="surface-alt" cls="bg-surface-alt" note="sayfa zemini" />
          <Swatch name="border" cls="bg-border" note="kenarlık, ayraç" />
          <Swatch name="text" cls="bg-text" note="birincil metin" />
          <Swatch name="muted" cls="bg-muted" note="ikincil metin" />
        </div>
      </Section>

      <Section title="Tipografi ölçeği">
        <div className="space-y-3 rounded-xl border border-border bg-surface p-6">
          <p className="font-heading text-display font-bold">Display — Hero başlığı (30px)</p>
          <p className="font-heading text-title font-bold">Title — Sayfa başlığı (24px)</p>
          <p className="font-heading text-heading font-semibold">Heading — Bölüm başlığı (20px)</p>
          <p className="text-body">
            Body — Ana gövde metni (16px). Beş mağazanın fiyatlarını tek ekranda karşılaştırın.
          </p>
          <p className="text-body-sm">
            Body small — Kart metni, ikincil gövde (14px). iPhone 15 128 GB, 5 mağazada
            karşılaştırıldı.
          </p>
          <p className="text-caption text-muted">
            Caption — Meta bilgi, dipnot (12px). Fiyatlar günde bir kez güncellenir.
          </p>
          <div className="border-t border-border pt-3">
            <p className="text-caption text-muted">
              Fiyatlar her zaman mono + tabular-nums (hizalı basamaklar):
            </p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <PriceTag price={1249} size="sm" />
              <PriceTag price={18930.5} size="md" />
              <PriceTag price={64999} size="lg" />
            </p>
          </div>
        </div>
      </Section>

      <Section title="Button">
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Fiyatları karşılaştır</Button>
            <Button variant="secondary">Mağazaya git</Button>
            <Button variant="ghost">Tümünü gör</Button>
            <Button variant="primary" disabled>
              Devre dışı
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary">
              Küçük (sm)
            </Button>
            <Button size="md" variant="secondary">
              Normal (md)
            </Button>
            <Button size="lg" variant="secondary">
              Büyük (lg)
            </Button>
            <Button variant="primary" size="lg">
              <SearchIcon className="h-5 w-5" /> İkonlu CTA
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-6">
          <Badge variant="discount">%18 indirim</Badge>
          <Badge variant="cheapest">En ucuz · Hepsiburada</Badge>
          <Badge variant="danger">
            <TrendDownIcon className="h-3.5 w-3.5 rotate-180" /> Fiyat yükseldi
          </Badge>
          <Badge variant="info">5 mağazada karşılaştırıldı</Badge>
          <Badge variant="neutral">Stok durumu bilinmiyor</Badge>
        </div>
      </Section>

      <Section title="Input">
        <div className="max-w-md space-y-4 rounded-xl border border-border bg-surface p-6">
          <SearchInput placeholder="Ürün ara — örn. iPhone 15" aria-label="Ürün ara" />
          <Input placeholder="İkonsuz düz input" aria-label="Örnek input" />
          <Input
            leadingIcon={<SearchIcon className="h-4.5 w-4.5" />}
            placeholder="Odaklanınca primary halka"
            aria-label="İkonlu input"
          />
        </div>
      </Section>

      <Section title="PriceTag">
        <div className="space-y-3 rounded-xl border border-border bg-surface p-6">
          <p className="flex items-baseline gap-4">
            <span className="w-40 text-caption text-muted">Normal</span>
            <PriceTag price={18930.5} />
          </p>
          <p className="flex items-baseline gap-4">
            <span className="w-40 text-caption text-muted">Eski fiyat üstü çizili</span>
            <PriceTag price={15499} oldPrice={18930.5} />
          </p>
          <p className="flex items-baseline gap-4">
            <span className="w-40 text-caption text-muted">En ucuz (semantik yeşil)</span>
            <PriceTag price={15499} oldPrice={16250} tone="cheapest" />
          </p>
          <p className="flex items-baseline gap-4">
            <span className="w-40 text-caption text-muted">Büyük — ürün detay</span>
            <PriceTag price={64999} oldPrice={72499} size="lg" tone="cheapest" />
          </p>
        </div>
      </Section>

      <Section title="CategoryChip">
        <div className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-surface p-6 scrollbar-none">
          <CategoryChip href="#" active>
            Akıllı Telefon
          </CategoryChip>
          <CategoryChip href="#">Tablet</CategoryChip>
          <CategoryChip href="#">Dizüstü Bilgisayar</CategoryChip>
          <CategoryChip href="#">Kulaklık</CategoryChip>
          <CategoryChip href="#">Akıllı Saat</CategoryChip>
        </div>
      </Section>

      <Section title="Card — ürün kartı kompozisyonu">
        <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Card interactive className="flex flex-col">
            <div className="flex h-40 items-center justify-center p-5">
              <Image
                src="/placeholder.svg"
                alt=""
                width={120}
                height={120}
                className="h-full w-auto object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4 pt-0">
              <div>
                <p className="line-clamp-2 text-body-sm font-medium text-text">
                  Apple iPhone 15 128 GB Siyah
                </p>
                <p className="mt-1 text-caption text-muted">5 mağazada karşılaştırıldı</p>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <PriceTag price={46499} oldPrice={49999} tone="cheapest" />
                <Badge variant="discount">%7</Badge>
              </div>
              <div className="mt-auto border-t border-border pt-3">
                <Badge variant="cheapest">En ucuz · Amazon</Badge>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-body-sm font-medium text-text">Statik kart (interactive değil)</p>
            <p className="mt-1 text-caption text-muted">
              Bilgi panelleri için: hover&apos;da kenarlık değişmez, gölge yok.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Grafik renkleri (site başına)">
        <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-surface p-6">
          <Swatch name="site-trendyol" cls="bg-site-trendyol" />
          <Swatch name="site-hepsiburada" cls="bg-site-hepsiburada" />
          <Swatch name="site-amazon" cls="bg-site-amazon" />
          <Swatch name="site-vatan" cls="bg-site-vatan" />
          <Swatch name="site-n11" cls="bg-site-n11" />
        </div>
      </Section>
    </div>
  );
}
