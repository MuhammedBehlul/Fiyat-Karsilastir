-- Genişletme adımı (expand): yeni varyant yapısı eski yapının YANINA eklenir.
-- Veri taşıma TS backfill script'iyle yapılır; daralma (contract) ayrı migration'dadır.

-- AlterTable: kanonik kimlik alanları (backfill'e kadar nullable)
ALTER TABLE "products" ADD COLUMN "brand" TEXT;
ALTER TABLE "products" ADD COLUMN "model" TEXT;
ALTER TABLE "products" ADD COLUMN "model_key" TEXT;

-- CreateTable
CREATE TABLE "product_variants" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "storage_gb" INTEGER,
    "ram_gb" INTEGER,
    "color" TEXT,
    "variant_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "search_key" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_reviews" (
    "id" SERIAL NOT NULL,
    "site_name" TEXT NOT NULL,
    "raw_title" TEXT NOT NULL,
    "product_url" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "candidate_variant_id" INTEGER,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_reviews_pkey" PRIMARY KEY ("id")
);

-- AlterTable: fiyat kayıtları varyanta bağlanacak (backfill'e kadar nullable)
ALTER TABLE "price_entries" ADD COLUMN "variant_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_product_id_variant_key_key" ON "product_variants"("product_id", "variant_key");

-- CreateIndex
CREATE INDEX "match_reviews_status_created_at_idx" ON "match_reviews"("status", "created_at");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_entries" ADD CONSTRAINT "price_entries_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
