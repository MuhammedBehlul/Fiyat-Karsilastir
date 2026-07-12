// Bakım script'i: marka sözlüğüne yeni marka eklendiğinde, DAHA ÖNCE
// brand=null olarak kaydedilmiş ürünleri geriye dönük düzeltir. Marka
// tanınması Product oluşturma anında yapılıyor; sözlük genişletmek zaten
// var olan satırları kendiliğinden güncellemiyor (modelKey/model AYNI kalır
// — parseProductTitle'ın tokenize ettiği kelimeler değişmiyor, yalnızca
// hangi token'ın "marka" sayıldığı değişiyor), bu yüzden ayrı bir geçiş gerekir.
//
//   npx tsx scrapers/backfill-brands.ts          -> yalnızca rapor (dry-run)
//   npx tsx scrapers/backfill-brands.ts --apply  -> Product.brand günceller

import 'dotenv/config';
import { prisma } from '../lib/db';
import { parseProductTitle } from '../lib/variant';

async function main() {
  const apply = process.argv.includes('--apply');

  const products = await prisma.product.findMany({
    where: { brand: null },
    select: { id: true, model: true, category: { select: { slug: true } } },
  });
  console.log(`${products.length} markasız ürün taranıyor...`);

  let found = 0;
  for (const p of products) {
    const parsed = parseProductTitle(p.model, { categorySlug: p.category?.slug });
    if (!parsed.brand) continue;
    found++;
    console.log(`${apply ? '[GÜNCELLENDİ]' : '[bulundu]'} "${p.model.slice(0, 60)}" -> ${parsed.brand}`);
    if (apply) {
      await prisma.product.update({ where: { id: p.id }, data: { brand: parsed.brand } });
    }
  }

  console.log(`\n${apply ? 'Uygulandı' : 'Dry-run'}: ${found}/${products.length} ürün için marka bulundu.`);
  if (!apply) console.log('(gerçekten güncellemek için --apply)');
  await prisma.$disconnect();
}

main();
