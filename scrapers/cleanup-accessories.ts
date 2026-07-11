// Bakım script'i: aksesuar filtresi geliştikçe eski taramalardan sızmış
// aksesuar kayıtlarını temizler. Varyant silinir (fiyat kayıtları cascade),
// varyantı kalmayan ürünler de silinir.
//   npx tsx scrapers/cleanup-accessories.ts          -> yalnızca listeler (dry-run)
//   npx tsx scrapers/cleanup-accessories.ts --apply  -> siler

import 'dotenv/config';
import { prisma } from '../lib/db';
import { foldTurkish, isAccessoryTitle } from '../lib/variant';

async function main() {
  const apply = process.argv.includes('--apply');
  const variants = await prisma.productVariant.findMany({
    select: {
      id: true,
      displayName: true,
      productId: true,
      product: { select: { category: { select: { slug: true } } } },
    },
  });

  const offenders = variants.filter((v) => {
    const slug = v.product.category?.slug;
    return slug ? isAccessoryTitle(slug, foldTurkish(v.displayName)) : false;
  });

  console.log(`${variants.length} varyantın ${offenders.length} tanesi aksesuar olarak işaretlendi:`);
  for (const v of offenders) console.log(`  - ${v.displayName.slice(0, 80)}`);

  if (!apply) {
    console.log('\n(dry-run — silmek için --apply)');
  } else if (offenders.length > 0) {
    await prisma.productVariant.deleteMany({ where: { id: { in: offenders.map((v) => v.id) } } });
    const emptyProducts = await prisma.product.deleteMany({ where: { variants: { none: {} } } });
    console.log(`\nSilindi: ${offenders.length} varyant, ${emptyProducts.count} boş ürün.`);
  }
  await prisma.$disconnect();
}
main();
