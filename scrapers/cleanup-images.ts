// Bakım script'i: eski taramalardan kalan şüpheli ürün görsellerini
// (lazy-load placeholder'ı, kampanya bandı, svg ikon) NULL'a çeker.
// Sonraki scrape koşusu persist'teki görsel iyileştirmeyle temiz görselleri doldurur.
//   npx tsx scrapers/cleanup-images.ts          -> yalnızca listeler (dry-run)
//   npx tsx scrapers/cleanup-images.ts --apply  -> temizler
//
// Desen kararı lib/normalize.ts isSuspectImageUrl'dedir — burada yeniden yazılmaz.

import 'dotenv/config';
import { prisma } from '../lib/db';
import { isSuspectImageUrl } from '../lib/normalize';

async function main() {
  const apply = process.argv.includes('--apply');

  const [variants, products] = await Promise.all([
    prisma.productVariant.findMany({
      where: { imageUrl: { not: null } },
      select: { id: true, displayName: true, imageUrl: true },
    }),
    prisma.product.findMany({
      where: { imageUrl: { not: null } },
      select: { id: true, model: true, imageUrl: true },
    }),
  ]);

  const badVariants = variants.filter((v) => isSuspectImageUrl(v.imageUrl!));
  const badProducts = products.filter((p) => isSuspectImageUrl(p.imageUrl!));

  console.log(`Şüpheli görsel: ${badVariants.length} varyant, ${badProducts.length} ürün`);
  const sampleUrls = new Set([...badVariants, ...badProducts].map((x) => x.imageUrl!));
  for (const u of [...sampleUrls].slice(0, 8)) console.log(`  - ${u}`);

  if (!apply) {
    console.log('\n(dry-run — temizlemek için --apply, ardından npm run scrape ile doldur)');
  } else {
    if (badVariants.length > 0)
      await prisma.productVariant.updateMany({
        where: { id: { in: badVariants.map((v) => v.id) } },
        data: { imageUrl: null },
      });
    if (badProducts.length > 0)
      await prisma.product.updateMany({
        where: { id: { in: badProducts.map((p) => p.id) } },
        data: { imageUrl: null },
      });
    console.log('\nTemizlendi. Görselleri doldurmak için: npm run scrape');
  }
  await prisma.$disconnect();
}
main();
