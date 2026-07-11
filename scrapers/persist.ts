// Scrape sonuçlarını veritabanına yazar: marka+model düzeyinde Product,
// depolama/RAM/renk düzeyinde ProductVariant eşleştirir; her kayıt için
// varyanta bağlı PriceEntry açar. Emin olunamayan eşleşmeler MatchReview'a düşer.

import { prisma } from '../lib/db';
import {
  parseProductTitle,
  searchKeyOf,
  variantKeyOf,
  type VariantAttrs,
} from '../lib/variant';
import {
  matchProduct,
  matchVariant,
  type CatalogProduct,
  type CatalogVariant,
} from '../lib/matching';
import { politeDelay } from './http';
import { CATEGORIES, type CategorySlug, type ScrapedProduct, type SiteName } from '../lib/types';

/** Ürün detay sayfasından yapılandırılmış nitelik getirir (ör. N11 renk alanı). */
export type DetailEnricher = (url: string) => Promise<Partial<VariantAttrs>>;

export interface SaveOptions {
  /** Başlıkta renk yoksa detay sayfasına başvurulacak fonksiyon. */
  enrich?: DetailEnricher;
  /** Koşu başına en fazla kaç detay isteği yapılacağı (rate limit koruması). */
  enrichLimit?: number;
}

export interface SaveOutcome {
  upserted: number;
  accessoriesSkipped: number;
  fuzzyAccepted: number;
  reviewLogged: number;
  enriched: number;
}

export async function startRun(site: SiteName): Promise<number> {
  const run = await prisma.scrapeRun.create({ data: { siteName: site } });
  return run.id;
}

export async function finishRun(
  runId: number,
  outcome: { status: 'success' | 'error'; productsFound: number; productsUpserted: number; errorMessage?: string },
): Promise<void> {
  await prisma.scrapeRun.update({
    where: { id: runId },
    data: { ...outcome, finishedAt: new Date() },
  });
}

/** Kataloğu belleğe alır: eşleştirme sorgusuz, saf fonksiyonlarla yapılır. */
async function loadCatalog(): Promise<Map<string, CatalogProduct>> {
  const rows = await prisma.product.findMany({
    select: {
      id: true,
      brand: true,
      modelKey: true,
      variants: { select: { id: true, storageGb: true, ramGb: true, color: true } },
    },
  });
  return new Map(rows.map((r) => [r.modelKey, r]));
}

export async function saveProducts(
  products: ScrapedProduct[],
  opts: SaveOptions = {},
): Promise<SaveOutcome> {
  // Bu partide görülen kategorileri hazırla (slug -> id).
  const categoryIds = new Map<CategorySlug, number>();
  for (const slug of new Set(products.map((p) => p.categorySlug))) {
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { slug, name: CATEGORIES[slug] },
    });
    categoryIds.set(slug, cat.id);
  }

  const byModelKey = await loadCatalog();
  const outcome: SaveOutcome = {
    upserted: 0,
    accessoriesSkipped: 0,
    fuzzyAccepted: 0,
    reviewLogged: 0,
    enriched: 0,
  };
  let enrichBudget = opts.enrichLimit ?? 25;

  for (const p of products) {
    const parsed = parseProductTitle(p.name, { attrHints: p.attrs, categorySlug: p.categorySlug });
    if (parsed.isAccessory) {
      outcome.accessoriesSkipped++;
      continue;
    }
    if (!parsed.modelKey) continue;

    // Başlıkta renk yoksa: bu URL daha önce renkli bir varyanta bağlandıysa onu
    // kullan (istek yok); değilse detay sayfasından yapılandırılmış rengi çek.
    // Yalnızca telefon: ev aletleri gibi kategorilerde renk çoğu üründe anlamsız,
    // istek bütçesini orada harcamayalım.
    if (parsed.attrs.color === null && opts.enrich && p.categorySlug === 'telefon') {
      const known = await prisma.priceEntry.findFirst({
        where: { productUrl: p.productUrl, variant: { color: { not: null } } },
        orderBy: { scrapedAt: 'desc' },
        select: { variant: { select: { color: true } } },
      });
      if (known?.variant.color) {
        parsed.attrs.color = known.variant.color;
      } else if (enrichBudget > 0) {
        enrichBudget--;
        await politeDelay();
        try {
          const detail = await opts.enrich(p.productUrl);
          parsed.attrs.color = detail.color ?? parsed.attrs.color;
          parsed.attrs.storageGb = parsed.attrs.storageGb ?? detail.storageGb ?? null;
          parsed.attrs.ramGb = parsed.attrs.ramGb ?? detail.ramGb ?? null;
          if (detail.color) outcome.enriched++;
        } catch (err) {
          console.warn(`  ⚠ detay zenginleştirme başarısız (${p.productUrl}): ${(err as Error).message}`);
        }
      }
    }

    // 1) Ürün (marka+model) eşleştir
    const match = matchProduct(byModelKey, parsed);
    let product: CatalogProduct;
    if (match.kind === 'exact' || match.kind === 'fuzzy') {
      product = match.product;
      if (match.kind === 'fuzzy') outcome.fuzzyAccepted++;
    } else {
      if (match.kind === 'review') {
        // Eşik altı benzerlik: sessizce birleştirme, incelemeye yaz; fiyat
        // verisi kaybolmasın diye kayıt kendi ürünü altında tutulur.
        await prisma.matchReview.create({
          data: {
            siteName: p.siteName,
            rawTitle: p.name,
            productUrl: p.productUrl,
            price: p.price,
            candidateVariantId: match.product.variants[0]?.id ?? null,
            score: match.score,
            reason: 'fuzzy-model',
          },
        });
        outcome.reviewLogged++;
      }
      const created = await prisma.product.create({
        data: {
          brand: parsed.brand,
          model: parsed.model,
          modelKey: parsed.modelKey,
          imageUrl: p.imageUrl,
          categoryId: categoryIds.get(p.categorySlug),
        },
        select: { id: true },
      });
      product = { id: created.id, brand: parsed.brand, modelKey: parsed.modelKey, variants: [] };
      byModelKey.set(parsed.modelKey, product);
    }

    // 2) Varyant eşleştir
    const vmatch = matchVariant(product, parsed.attrs);
    let variant: CatalogVariant;
    if (vmatch.kind === 'reuse') {
      variant = vmatch.variant;
      if (Object.keys(vmatch.fill).length > 0) {
        Object.assign(variant, vmatch.fill);
        const attrs = variant as VariantAttrs;
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            ...vmatch.fill,
            variantKey: variantKeyOf(attrs),
            searchKey: searchKeyOf(product.modelKey, attrs),
          },
        });
      }
    } else {
      if (vmatch.kind === 'ambiguous') {
        await prisma.matchReview.create({
          data: {
            siteName: p.siteName,
            rawTitle: p.name,
            productUrl: p.productUrl,
            price: p.price,
            candidateVariantId: vmatch.candidates[0].id,
            score: 0,
            reason: 'ambiguous-variant',
          },
        });
        outcome.reviewLogged++;
      }
      const created = await prisma.productVariant.create({
        data: {
          productId: product.id,
          storageGb: parsed.attrs.storageGb,
          ramGb: parsed.attrs.ramGb,
          color: parsed.attrs.color,
          variantKey: variantKeyOf(parsed.attrs),
          displayName: p.name,
          searchKey: searchKeyOf(product.modelKey, parsed.attrs),
          imageUrl: p.imageUrl,
        },
        select: { id: true },
      });
      variant = { id: created.id, ...parsed.attrs };
      product.variants.push(variant);
    }

    // 3) Aynı URL'in geçmişi renksiz bir ikiz varyantta kaldıysa buraya taşı
    // (N11 zenginleştirmesi renk öğrenince eski "renk bilinmiyor" kaydı iyileşir).
    if (parsed.attrs.color !== null) {
      const twin = product.variants.find(
        (v) => v.id !== variant.id && v.color === null && v.storageGb === variant.storageGb,
      );
      if (twin) {
        const moved = await prisma.priceEntry.updateMany({
          where: { variantId: twin.id, productUrl: p.productUrl },
          data: { variantId: variant.id },
        });
        if (moved.count > 0) {
          const remaining = await prisma.priceEntry.count({ where: { variantId: twin.id } });
          if (remaining === 0) {
            await prisma.productVariant.delete({ where: { id: twin.id } });
            product.variants = product.variants.filter((v) => v.id !== twin.id);
          }
        }
      }
    }

    await prisma.priceEntry.create({
      data: {
        variantId: variant.id,
        siteName: p.siteName,
        price: p.price,
        currency: p.currency,
        productUrl: p.productUrl,
      },
    });
    outcome.upserted++;

    // Görseli olmayan kayda sonradan gelen görseli ekle.
    if (p.imageUrl) {
      await prisma.productVariant.updateMany({
        where: { id: variant.id, imageUrl: null },
        data: { imageUrl: p.imageUrl },
      });
      await prisma.product.updateMany({
        where: { id: product.id, imageUrl: null },
        data: { imageUrl: p.imageUrl },
      });
    }
  }

  return outcome;
}
