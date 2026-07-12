// Bakım script'i: bekleyen MatchReview kayıtlarından YÜKSEK GÜVENİLİRLİKLİ
// olanları (skor >= --min, varsayılan 0.85) otomatik onaylar ve adayla
// birleştirir — marka her iki tarafta da bilinmiyorsa veya eşleşmiyorsa
// ASLA birleştirmez (skor ne olursa olsun), kategori uyuşmuyorsa da atlar.
// Aynı persist.ts'in canlı akışta kullandığı matchVariant() fonksiyonunu
// kullanır: adayın varyantlarından biriyle tam/uyumlu eşleşiyorsa fiyat
// kayıtları oraya taşınır (reuse), değilse çift ürünün kendi varyantı
// olduğu gibi adayın altına taşınır (reparent) — hiçbir fiyat geçmişi
// silinmez, yalnızca hangi ürüne bağlı olduğu değişir.
//
// Güvenlik önlemleri (üç dry-run turunda somut örneklerle bulundu — elle
// gözden geçirmeden --apply çalıştırma, yeni kategoriler eklenince bu liste
// yeniden gözden geçirilmeli):
// 1) petshop/supermarket/anne-bebek/kozmetik ATLANIR — bu kategorilerde
//    marka+ölçü aynıyken ürün GERÇEKTE FARKLI olabiliyor ve bu fark hiçbir
//    izlenen nitelikte (weight_g/volume_ml/pack_count/size/color) yakalanmıyor:
//      - "tavuklu" vs "somonlu" mama, "limon" vs "okaliptus" çamaşır suyu
//        (lezzet/koku izlenmiyor)
//      - "bebek bezi" (bantlı) vs "kulot bez" (külot tipi) — aynı marka/
//        beden/adet ama FARKLI ürün formu; listede ~15 kez tekrar etti.
//      - "erkek" vs "kadın" deodorant — CİNSİYET izlenmiyor; "Clinical
//        Protection Confidence" erkek/kadın spreyleri [reuse] ile aynı
//        varyanta birleşecekti (kozmetiğin geri kalanı marka/koku farkları
//        yüzünden de aynı riski taşıyor, tamamı hariç tutuldu).
// 2) İki modelKey arasında ORTAK TOKEN sayısı >= MIN_SHARED_TOKENS değilse
//    atlanır — "Redmi Note 13" ile "Redmi 13" yalnızca {redmi,13} paylaşıyor
//    (2 token) ve skor 0.86'ya çıkabiliyor ama bunlar FARKLI telefonlar;
//    "note" MODEL_DIFFERENTIATORS kümesinde olmadığından mevcut ayırt edici
//    kapısı bunu yakalamıyor. 3+ ortak token, kısa/jenerik kelime
//    çakışmalarını büyük ölçüde eler.
// 3) MANUAL_SKIP_REVIEW_IDS — elle bulunan, otomatikleştirilmemiş istisnalar.
//    Bunların ortak noktası: tek bir kelime farkı GERÇEK bir farklı ürün/
//    paket/cinsiyet anlamına geliyor ama "erkek/kadın/kol/saati" gibi
//    jenerik dolgu kelimeler ortak-token eşiğini bedavadan geçiriyor.
//    moda/spor-outdoor'un geri kalanı (beden/renk izlendiği için) güvenli,
//    bu yüzden tüm kategoriyi değil yalnızca bu satırları atlıyoruz:
//      456,461: saat referans kodları ("GA-2100" vs "GBM-2100", "EF-539D"
//               vs "EFR-539D") — farklı ürünler.
//      206:     AKUT deprem çantası "tek" vs "çift kişilik" — farklı
//               paket/içerik/fiyat.
//      814:     DJI Osmo Action 5 Pro "Standard Combo" vs "Adventure
//               Combo" — DJI'nin resmi olarak FARKLI aksesuar setli/
//               fiyatlı iki paketi.
//      715:     Muggo "SKY" vs "SKATE" — muhtemelen farklı model adı,
//               renk/baskı değil.
//      202:     Salomon ayakkabı "erkek" vs "unisex" — belirsiz, riske
//               girmemek için atlandı (aynı çiftin "erkek"-"erkek" hâli
//               id 205 zaten güvenle geçiyor).
//
//   npx tsx scrapers/approve-match-reviews.ts               -> yalnızca rapor (dry-run)
//   npx tsx scrapers/approve-match-reviews.ts --apply        -> birleştirir
//   npx tsx scrapers/approve-match-reviews.ts --apply --min=0.9

import 'dotenv/config';
import { prisma } from '../lib/db';
import { CATEGORY_ATTRIBUTES, searchKeyFor, variantKeyFor, type AttrValues } from '../lib/attributes';
import { matchVariant, type CatalogProduct, type CatalogVariant } from '../lib/matching';
import { foldTurkish } from '../lib/variant';
import type { CategorySlug } from '../lib/types';

/** Marka+ölçü aynıyken üründe izlenmeyen bir farkın (lezzet/koku/form/cinsiyet) olabildiği kategoriler. */
const EXCLUDED_CATEGORIES = new Set<CategorySlug>(['petshop', 'supermarket', 'anne-bebek', 'kozmetik']);
const MIN_SHARED_TOKENS = 3;
const MANUAL_SKIP_REVIEW_IDS = new Set([456, 461, 206, 814, 715, 202]);

/**
 * Marka kelimeleri (ve "redmi"->xiaomi gibi ima edilen marka token'ı) sayıma
 * katılmaz — zaten ayrı bir kontrolle marka eşitliği garanti; onları da
 * sayarsak "Redmi Note 13" ~ "Redmi 13" gibi çiftler {13,redmi,xiaomi}
 * paylaşıp eşiği (3) BEDAVA tutturuyor, oysa gerçek ayırt edici örtüşme
 * yalnızca {13,redmi}. Çok kelimeli markalar için ("Pro Plan") her kelime
 * ayrı hariç tutulur.
 */
function sharedTokenCount(a: string, b: string, excludeWords: Set<string>): number {
  const setA = new Set(a.split(' ').filter((t) => t && !excludeWords.has(t)));
  const setB = new Set(b.split(' ').filter((t) => t && !excludeWords.has(t)));
  let common = 0;
  for (const t of setA) if (setB.has(t)) common++;
  return common;
}

interface Outcome {
  approved: number;
  skippedBrand: number;
  skippedCategory: number;
  skippedTokenOverlap: number;
  skippedManual: number;
  skippedMissing: number;
  skippedError: number;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const minArg = process.argv.find((a) => a.startsWith('--min='));
  const minScore = minArg ? Number(minArg.slice('--min='.length)) : 0.85;

  const reviews = await prisma.matchReview.findMany({
    where: { status: 'pending', reason: 'fuzzy-model', score: { gte: minScore } },
    orderBy: { score: 'desc' },
  });
  console.log(`${reviews.length} bekleyen kayıt skor >= ${minScore} (fuzzy-model).`);

  const outcome: Outcome = {
    approved: 0,
    skippedBrand: 0,
    skippedCategory: 0,
    skippedTokenOverlap: 0,
    skippedManual: 0,
    skippedMissing: 0,
    skippedError: 0,
  };

  for (const review of reviews) {
    if (MANUAL_SKIP_REVIEW_IDS.has(review.id)) {
      outcome.skippedManual++;
      continue;
    }
    if (!review.candidateVariantId) {
      outcome.skippedMissing++;
      continue;
    }

    const candidateVariant = await prisma.productVariant.findUnique({
      where: { id: review.candidateVariantId },
      include: { product: { include: { category: { select: { slug: true } } } } },
    });
    const latestEntry = await prisma.priceEntry.findFirst({
      where: { productUrl: review.productUrl },
      orderBy: { scrapedAt: 'desc' },
      include: { variant: { include: { product: { include: { category: { select: { slug: true } } } } } } },
    });
    if (!candidateVariant || !latestEntry) {
      outcome.skippedMissing++;
      continue;
    }

    const candidateProduct = candidateVariant.product;
    const duplicateVariant = latestEntry.variant;
    const duplicateProduct = duplicateVariant.product;

    if (duplicateProduct.id === candidateProduct.id) continue; // bu koşuda zaten birleşti

    if (!candidateProduct.brand || !duplicateProduct.brand || candidateProduct.brand !== duplicateProduct.brand) {
      outcome.skippedBrand++;
      continue;
    }
    const categorySlug = candidateProduct.category?.slug as CategorySlug | undefined;
    if (!categorySlug || categorySlug !== duplicateProduct.category?.slug) {
      outcome.skippedCategory++;
      continue;
    }
    if (EXCLUDED_CATEGORIES.has(categorySlug)) {
      outcome.skippedCategory++;
      continue;
    }
    const brandWords = new Set(foldTurkish(candidateProduct.brand).split(' ').filter(Boolean));
    if (sharedTokenCount(candidateProduct.modelKey, duplicateProduct.modelKey, brandWords) < MIN_SHARED_TOKENS) {
      outcome.skippedTokenOverlap++;
      continue;
    }

    const defs = CATEGORY_ATTRIBUTES[categorySlug];
    const candidateVariants = await prisma.productVariant.findMany({
      where: { productId: candidateProduct.id },
      select: { id: true, attrs: true },
    });
    const catalogProduct: CatalogProduct = {
      id: candidateProduct.id,
      brand: candidateProduct.brand,
      modelKey: candidateProduct.modelKey,
      variants: candidateVariants.map((v) => ({ id: v.id, attrs: (v.attrs ?? {}) as AttrValues })) as CatalogVariant[],
    };
    const duplicateAttrs = (duplicateVariant.attrs ?? {}) as AttrValues;
    const vmatch = matchVariant(defs, catalogProduct, duplicateAttrs);

    const label = `"${duplicateProduct.model}" (${review.siteName}, skor ${review.score.toFixed(2)}) -> "${candidateProduct.model}"`;

    try {
      if (vmatch.kind === 'reuse') {
        console.log(`${apply ? '[BİRLEŞTİRİLDİ]' : '[reuse]'} ${label}`);
        if (apply) {
          await prisma.$transaction(async (tx) => {
            const mergedAttrs = { ...vmatch.variant.attrs, ...vmatch.fill };
            if (Object.keys(vmatch.fill).length > 0) {
              await tx.productVariant.update({
                where: { id: vmatch.variant.id },
                data: {
                  storageGb: (mergedAttrs.storage_gb as number | undefined) ?? null,
                  ramGb: (mergedAttrs.ram_gb as number | undefined) ?? null,
                  color: (mergedAttrs.color as string | undefined) ?? null,
                  attrs: mergedAttrs,
                  variantKey: variantKeyFor(categorySlug, mergedAttrs),
                  searchKey: searchKeyFor(candidateProduct.modelKey, mergedAttrs),
                },
              });
            }
            await tx.priceEntry.updateMany({
              where: { variantId: duplicateVariant.id },
              data: { variantId: vmatch.variant.id },
            });
            await tx.productVariant.delete({ where: { id: duplicateVariant.id } });
            const remaining = await tx.productVariant.count({ where: { productId: duplicateProduct.id } });
            if (remaining === 0) await tx.product.delete({ where: { id: duplicateProduct.id } });
            await tx.matchReview.update({ where: { id: review.id }, data: { status: 'approved' } });
          });
        }
      } else {
        // 'new' | 'ambiguous': adayın hiçbir varyantıyla tam uyuşmuyor —
        // çift varyant SİLİNMEZ, olduğu gibi aday ürünün altına taşınır.
        console.log(`${apply ? '[BİRLEŞTİRİLDİ]' : '[reparent]'} ${label}`);
        if (apply) {
          await prisma.$transaction(async (tx) => {
            await tx.productVariant.update({
              where: { id: duplicateVariant.id },
              data: {
                productId: candidateProduct.id,
                searchKey: searchKeyFor(candidateProduct.modelKey, duplicateAttrs),
              },
            });
            const remaining = await tx.productVariant.count({ where: { productId: duplicateProduct.id } });
            if (remaining === 0) await tx.product.delete({ where: { id: duplicateProduct.id } });
            await tx.matchReview.update({ where: { id: review.id }, data: { status: 'approved' } });
          });
        }
      }
      outcome.approved++;
    } catch (err) {
      outcome.skippedError++;
      console.warn(`  ⚠ atlandı (${(err as Error).message}): ${label}`);
    }
  }

  console.log(
    `\n${apply ? 'Uygulandı' : 'Dry-run'}: ${outcome.approved} onaylanabilir` +
      `, ${outcome.skippedBrand} marka uyuşmadı/bilinmiyor` +
      `, ${outcome.skippedCategory} kategori uyuşmadı/hariç tutuldu` +
      `, ${outcome.skippedTokenOverlap} ortak token yetersiz (<${MIN_SHARED_TOKENS})` +
      `, ${outcome.skippedManual} elle hariç tutuldu` +
      `, ${outcome.skippedMissing} kayıt bulunamadı` +
      `, ${outcome.skippedError} hata`,
  );
  if (!apply) console.log('(gerçekten birleştirmek için --apply)');
  await prisma.$disconnect();
}

main();
