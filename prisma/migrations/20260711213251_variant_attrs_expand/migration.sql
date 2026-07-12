-- Genişleme fazı (expand/contract): attrs JSONB eklenir ve eski kolonlardan
-- doldurulur; storage_gb/ram_gb/color kolonları okuyucular taşınana dek kalır
-- ve persist.ts tarafından çift yazılır. Daralma ayrı bir migration'dır.

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "attrs" JSONB NOT NULL DEFAULT '{}';

-- Backfill: mevcut depolama/RAM/renk değerleri genel nitelik kaydına taşınır
-- (bilinmeyen alan anahtarsız — null yazılmaz).
UPDATE "product_variants"
SET "attrs" = jsonb_strip_nulls(jsonb_build_object(
  'storage_gb', "storage_gb",
  'ram_gb', "ram_gb",
  'color', "color"
));

-- variant_key eski "s128|r8|mavi" biçiminden genel biçime yeniden yazılır:
-- kategori niteliklerinin anahtarları alfabetik, bilinmeyen "?" —
-- lib/attributes.ts variantKeyFor ile birebir aynı olmalıdır.
UPDATE "product_variants"
SET "variant_key" =
  'color=' || COALESCE("color", '?') ||
  '|ram_gb=' || COALESCE("ram_gb"::text, '?') ||
  '|storage_gb=' || COALESCE("storage_gb"::text, '?');

-- Nitelik filtreleri için containment indeksi (attrs @> '{"color":"mavi"}').
CREATE INDEX "product_variants_attrs_gin" ON "product_variants" USING GIN ("attrs" jsonb_path_ops);

-- Yeni yaprak kategoriler önden eklenir: /kategori/<slug> sayfaları ilk tarama
-- beklenmeden 404 yerine "henüz ürün yok" boş durumunu göstersin.
-- Adlar lib/types.ts CATEGORIES ile birebir aynıdır (persist.ts aynı adla upsert eder).
INSERT INTO "categories" ("slug", "name") VALUES
  ('ev-yasam', 'Ev & Yaşam'),
  ('anne-bebek', 'Anne & Bebek'),
  ('moda', 'Moda & Aksesuar'),
  ('kitap-muzik-hobi', 'Kitap, Müzik & Hobi'),
  ('spor-outdoor', 'Spor & Outdoor'),
  ('kozmetik', 'Kozmetik & Kişisel Bakım'),
  ('oto-bahce-yapi', 'Oto, Bahçe & Yapı Market'),
  ('petshop', 'Petshop'),
  ('supermarket', 'Süpermarket')
ON CONFLICT ("slug") DO NOTHING;
