-- Daralma adımı (contract): backfill sonrası eski yapı sökülür.
-- backfill-variants.ts BAŞARIYLA çalıştıktan sonra uygulanır.

-- Varyanta bağlanamayan fiyat kayıtları (telefon kategorisine yanlış girmiş
-- aksesuarlar) temizlenir.
DELETE FROM "price_entries" WHERE "variant_id" IS NULL;

-- price_entries: product_id -> variant_id geçişi tamamlanır
ALTER TABLE "price_entries" DROP CONSTRAINT "price_entries_product_id_fkey";
DROP INDEX "price_entries_product_id_scraped_at_idx";
ALTER TABLE "price_entries" DROP COLUMN "product_id";
ALTER TABLE "price_entries" ALTER COLUMN "variant_id" SET NOT NULL;
CREATE INDEX "price_entries_variant_id_scraped_at_idx" ON "price_entries"("variant_id", "scraped_at");

-- Eski başlık-düzeyi ürün satırları (model_key NULL) silinir; kanonikler kalır.
DELETE FROM "products" WHERE "model_key" IS NULL;
DROP INDEX "products_normalized_name_key";
ALTER TABLE "products" DROP COLUMN "name";
ALTER TABLE "products" DROP COLUMN "normalized_name";
ALTER TABLE "products" ALTER COLUMN "model" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "model_key" SET NOT NULL;
CREATE UNIQUE INDEX "products_model_key_key" ON "products"("model_key");
