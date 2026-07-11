import 'dotenv/config';
import { prisma } from './lib/db';

async function main() {
  // Ekran görüntüsündeki iki sorunlu ürün
  const bad = await prisma.productVariant.findMany({
    where: {
      OR: [
        { displayName: { contains: 'Redmi 15C 8GB RAM 256GB' } },
        { displayName: { contains: 'Galaxy A26 5g 256' } },
        { displayName: { contains: 'Galaxy A17 5G 8/256' } },
        { displayName: { contains: 'Galaxy A07 128 GB 4' } },
      ],
    },
    select: { id: true, displayName: true, imageUrl: true, product: { select: { imageUrl: true } } },
  });
  for (const v of bad) {
    console.log(`#${v.id} ${v.displayName.slice(0, 50)}`);
    console.log(`   variant: ${v.imageUrl}`);
    console.log(`   product: ${v.product.imageUrl}`);
  }

  // Genel desen sayımı: host + uzantı bazında
  const all = await prisma.productVariant.findMany({ select: { imageUrl: true } });
  const hostCount = new Map<string, number>();
  let nullCount = 0;
  let svgCount = 0;
  const svgSamples = new Set<string>();
  for (const v of all) {
    if (!v.imageUrl) {
      nullCount++;
      continue;
    }
    try {
      const u = new URL(v.imageUrl);
      hostCount.set(u.hostname, (hostCount.get(u.hostname) ?? 0) + 1);
      if (u.pathname.endsWith('.svg')) {
        svgCount++;
        if (svgSamples.size < 8) svgSamples.add(v.imageUrl);
      }
    } catch {
      hostCount.set('(geçersiz url)', (hostCount.get('(geçersiz url)') ?? 0) + 1);
    }
  }
  console.log(`\nToplam ${all.length} varyant, imageUrl null: ${nullCount}, svg: ${svgCount}`);
  for (const [h, n] of [...hostCount.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${h}`);
  if (svgSamples.size) {
    console.log('\nSVG örnekleri:');
    for (const s of svgSamples) console.log(`  ${s}`);
  }
  await prisma.$disconnect();
}
main();
