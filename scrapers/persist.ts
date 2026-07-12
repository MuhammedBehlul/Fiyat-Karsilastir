// Scrape sonuçlarını veritabanına yazar: marka+model düzeyinde Product,
// kategoriye tanımlı nitelik imzası düzeyinde (lib/attributes.ts) ProductVariant
// eşleştirir; her kayıt için varyanta bağlı PriceEntry açar. Emin olunamayan
// eşleşmeler MatchReview'a düşer.

import { prisma } from '../lib/db';
import { parseProductTitle } from '../lib/variant';
import {
  buildAttrValues,
  searchKeyFor,
  variantKeyFor,
  CATEGORY_ATTRIBUTES,
  type AttrValues,
} from '../lib/attributes';
import {
  matchProduct,
  matchVariant,
  type CatalogProduct,
  type CatalogVariant,
} from '../lib/matching';
import { politeDelay } from './http';
import type { DetailInfo } from './engine';
import { CATEGORIES, type CategorySlug, type ScrapedProduct, type SiteName } from '../lib/types';

/**
 * "Bu kayıttaki görsel değiştirilebilir" koşulları — lib/normalize.ts'teki
 * isSuspectImageUrl ile AYNI desenlerin Prisma karşılığı (sorguda regex yok):
 * null, placeholder, kampanya bandı (/banners/), svg. Desenler değişirse iki
 * yer birlikte güncellenir.
 */
const SUSPECT_IMAGE_CONDITIONS = [
  { imageUrl: null },
  { imageUrl: { contains: 'placeholder' } },
  { imageUrl: { contains: '/banners/' } },
  { imageUrl: { endsWith: '.svg' } },
];

/** Ürün detay sayfasından yapılandırılmış nitelik + görsel getirir (ör. N11). */
export type DetailEnricher = (url: string) => Promise<DetailInfo>;

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
      variants: { select: { id: true, attrs: true } },
    },
  });
  return new Map(
    rows.map((r) => [
      r.modelKey,
      {
        ...r,
        variants: r.variants.map((v) => ({ id: v.id, attrs: (v.attrs ?? {}) as AttrValues })),
      },
    ]),
  );
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
          // Aynı yanıttan gelen ürün görseli: listelemede lazy-load yüzünden
          // görsel yakalanamadıysa (N11'de yaygın) buradan doldurulur.
          p.imageUrl = p.imageUrl ?? detail.imageUrl;
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

    // 2) Varyant eşleştir: kategoriye tanımlı nitelik kümesiyle (lib/attributes.ts).
    // Elektronik dışı kategorilerde hacim/ağırlık/paket başlıktan çıkarılır ki
    // "500 ml" ile "1 L" aynı varyanta birleşmesin.
    const defs = CATEGORY_ATTRIBUTES[p.categorySlug];
    const values = buildAttrValues(p.categorySlug, parsed.attrs, p.name);
    const vmatch = matchVariant(defs, product, values);
    let variant: CatalogVariant;
    if (vmatch.kind === 'reuse') {
      variant = vmatch.variant;
      if (Object.keys(vmatch.fill).length > 0) {
        variant.attrs = { ...variant.attrs, ...vmatch.fill };
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            // Çift yazım (expand fazı): eski kolonlar attrs'tan türetilir.
            storageGb: (variant.attrs.storage_gb as number | undefined) ?? null,
            ramGb: (variant.attrs.ram_gb as number | undefined) ?? null,
            color: (variant.attrs.color as string | undefined) ?? null,
            attrs: variant.attrs,
            variantKey: variantKeyFor(p.categorySlug, variant.attrs),
            searchKey: searchKeyFor(product.modelKey, variant.attrs),
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
      // Çift yazım (expand fazı): eski kolonlar VE attrs birlikte yazılır;
      // okuyucular attrs'a taşınınca kolonlar contract migration'ıyla düşer.
      const created = await prisma.productVariant.create({
        data: {
          productId: product.id,
          storageGb: (values.storage_gb as number | undefined) ?? null,
          ramGb: (values.ram_gb as number | undefined) ?? null,
          color: (values.color as string | undefined) ?? null,
          attrs: values,
          variantKey: variantKeyFor(p.categorySlug, values),
          displayName: p.name,
          searchKey: searchKeyFor(product.modelKey, values),
          imageUrl: p.imageUrl,
        },
        select: { id: true },
      });
      variant = { id: created.id, attrs: values };
      product.variants.push(variant);
    }

    // 3) Aynı URL'in geçmişi renksiz bir ikiz varyantta kaldıysa buraya taşı
    // (N11 zenginleştirmesi renk öğrenince eski "renk bilinmiyor" kaydı iyileşir).
    const colorDef = defs.find((d) => d.kind === 'color');
    if (colorDef && variant.attrs.color != null) {
      const twin = product.variants.find(
        (v) =>
          v.id !== variant.id &&
          v.attrs.color == null &&
          defs.every(
            (d) =>
              d.key === colorDef.key ||
              v.attrs[d.key] == null ||
              variant.attrs[d.key] == null ||
              v.attrs[d.key] === variant.attrs[d.key],
          ),
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

    // Görsel iyileştirme: kayıtta görsel yoksa YA DA şüpheli bir görsel
    // (placeholder/rozet/svg — eski taramalardan kalma) duruyorsa temiz gelenle
    // değiştir. Scraper'lar pickImageUrl'den geçirdiği için p.imageUrl temizdir.
    if (p.imageUrl) {
      await prisma.productVariant.updateMany({
        where: { id: variant.id, OR: SUSPECT_IMAGE_CONDITIONS },
        data: { imageUrl: p.imageUrl },
      });
      await prisma.product.updateMany({
        where: { id: product.id, OR: SUSPECT_IMAGE_CONDITIONS },
        data: { imageUrl: p.imageUrl },
      });
    }
  }

  return outcome;
}
