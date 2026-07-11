// Eşleştirme kalitesi raporu: kaç varyant kaç sitede fiyat buluyor?
// Kullanım: npx tsx scrapers/match-stats.ts [--samples]

import 'dotenv/config';
import { prisma } from '../lib/db';

async function main() {
  const showSamples = process.argv.includes('--samples');

  const variants = await prisma.productVariant.findMany({
    select: {
      id: true,
      displayName: true,
      variantKey: true,
      product: {
        select: { brand: true, model: true, modelKey: true, category: { select: { slug: true } } },
      },
      priceEntries: { select: { siteName: true }, distinct: ['siteName'] },
    },
  });

  const bySiteCount = new Map<number, number>();
  for (const v of variants) {
    const n = v.priceEntries.length;
    bySiteCount.set(n, (bySiteCount.get(n) ?? 0) + 1);
  }

  const products = await prisma.product.count();
  console.log(`Kanonik ürün (marka+model): ${products}, varyant (SKU): ${variants.length}`);
  for (const [n, count] of [...bySiteCount.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  ${n} sitede görülen varyant: ${count}`);
  }
  console.log(`>=2 site: ${variants.filter((v) => v.priceEntries.length >= 2).length}`);
  console.log(`>=3 site: ${variants.filter((v) => v.priceEntries.length >= 3).length}`);

  const pending = await prisma.matchReview.count({ where: { status: 'pending' } });
  console.log(`İnceleme bekleyen eşleşme adayı: ${pending}`);

  console.log('\nKategori bazında (varyant / >=2 site / >=3 site):');
  const byCat = new Map<string, { total: number; m2: number; m3: number }>();
  for (const v of variants) {
    const slug = v.product.category?.slug ?? '(kategorisiz)';
    const s = byCat.get(slug) ?? { total: 0, m2: 0, m3: 0 };
    s.total++;
    if (v.priceEntries.length >= 2) s.m2++;
    if (v.priceEntries.length >= 3) s.m3++;
    byCat.set(slug, s);
  }
  for (const [slug, s] of [...byCat.entries()].sort()) {
    console.log(`  ${slug.padEnd(14)} ${String(s.total).padStart(4)} / ${String(s.m2).padStart(3)} / ${String(s.m3).padStart(3)}`);
  }

  if (showSamples) {
    console.log('\n=== 3+ sitede eşleşen varyantlar ===');
    for (const v of variants.filter((x) => x.priceEntries.length >= 3)) {
      console.log(
        `  [${v.priceEntries.map((e) => e.siteName).join(',')}] ${v.product.modelKey} | ${v.variantKey}`,
      );
      console.log(`      ${v.displayName.slice(0, 80)}`);
    }
  }

  await prisma.$disconnect();
}

main();
