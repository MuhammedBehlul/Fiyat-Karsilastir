# FiyatKarşılaştır

Trendyol, Hepsiburada, Amazon.com.tr, Vatan Bilgisayar ve N11'den telefon, laptop,
kulaklık ve ev aletleri fiyatlarını günlük toplayıp tek ekranda karşılaştıran mobil
öncelikli web uygulaması.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS v4
- **PostgreSQL** (Supabase) + **Prisma 7**
- **Scraping:** cheerio + fetch; bot korumalı sitelerde otomatik Playwright fallback
- **Zamanlama:** GitHub Actions cron (günde 1 kez), **Deploy:** Vercel

## Mimari

```
lib/         Saf TypeScript iş mantığı — Next.js importu YOK (React Native'e taşınabilir)
  types.ts       Ortak tipler (ScrapedProduct, ProductWithPrices, SiteName)
  variant.ts     Başlık ayrıştırma: marka+model anahtarı ve varyant imzası (depolama/RAM/renk, TR+EN)
  matching.ts    Siteler arası eşleştirme kuralları: tam anahtar, fuzzy (Dice) + eşikler, varyant uyumu
  normalize.ts   Fiyat parse + görüntüleme yardımcıları
  history.ts     Fiyat geçmişi -> grafik serisi dönüşümleri
  queries.ts     Veri erişim fonksiyonları (Prisma)
  db.ts          Prisma client singleton
components/  Sunum bileşenleri (props ile veri alır)
app/         Next.js sayfaları: / , /ara , /urun/[id] , /kategori/[slug] , /admin
scrapers/    Site scraper'ları + ortak motor (engine, http, browser, persist, run, match-stats)
```

## Ürün kimliği ve eşleştirme

- **Product** = kanonik kimlik (marka + model, ör. "Apple iPhone 15").
- **ProductVariant** = SKU imzası (depolama / RAM / renk). 128 GB ile 256 GB, Siyah ile
  Mavi ayrı varyanttır; fiyatlar (**PriceEntry**) varyanta bağlanır, asla karıştırılmaz.
- Eşleştirme: başlık `lib/variant.ts` ile ayrıştırılır (yapılandırılmış alan varsa o
  öncelikli — ör. N11 detay sayfasındaki "Renk" özelliği). Model anahtarı tam eşleşmezse
  token-küme Dice benzerliğine düşülür: ≥0.90 otomatik kabul, 0.75–0.90 arası **MatchReview**
  tablosuna "incelenecek" olarak yazılır (sessizce birleştirilmez), altı yeni ürün açar.
  Ayırt edici token'lar (model numarası, Pro/Plus/Max/Ultra...) fuzzy'de asla köprülenmez.
- Bilinmeyen alan kuralı: RAM'i yazmayan site tek uyumlu varyanta katılır (RAM doldurulur);
  rengi bilinmeyen kayıt renkli varyantla BİRLEŞTİRİLMEZ, kendi "renk bilinmiyor"
  varyantında bekler (N11 için renk detay sayfasından zenginleştirilir).
- Rapor: `npx tsx scrapers/match-stats.ts --samples` kaç varyantın kaç sitede
  eşleştiğini gösterir; bekleyen eşleşme adayları /admin sayfasında listelenir.

## Kurulum

```bash
npm install
cp .env.example .env   # Supabase bağlantı bilgilerini doldur
npx prisma migrate dev # şemayı veritabanına uygula
npx playwright install chromium
npm run dev
```

## Scraping

```bash
npm run scrape                 # tüm siteler, DB'ye yazar
npm run scrape -- trendyol n11 # yalnızca seçilen siteler
npm run scrape -- --dry        # DB olmadan konsola döker (test)
```

Kategoriler: **telefon, laptop, kulaklık, ev aletleri** — kategori URL'leri her sitenin
kendi navigasyonundan alınıp canlı doğrulandı (tahmin yok). Sayfalama kategori başına
varsayılan 5 sayfa (`SCRAPE_MAX_PAGES`, 1-10); yeni ürün gelmeyen sayfada erken durur.

Site başına yöntem (canlı test sonuçları):

| Site | Yöntem | Sayfalama | Not |
|---|---|---|---|
| Trendyol | fetch → Playwright fallback | `?pi=N` | Cloudflare; Playwright'ın ham SSR yanıtı parse edilir |
| Hepsiburada | fetch (tam Chrome header seti) | `?sayfa=N` | Headless tarayıcıya challenge veriyor, fetch'e vermiyor |
| Amazon.com.tr | fetch | yok | /b browse sayfalarında klasik sayfalama yok |
| Vatan | fetch | yok | robots.txt `?page=` parametresini yasaklıyor |
| N11 | fetch → Playwright fallback | `?pg=N` | Ürün detayından renk zenginleştirme (koşu başına ≤25 istek) |

Kurallar: robots.txt'e uyulur (yasaklı query parametreleri kullanılmaz, URL'ler temizlenir),
istekler arası 2-4 sn gecikme, gerçekçi User-Agent, site başına bağımsız hata yönetimi +
`ScrapeRun` logu (`/admin` sayfasında görünür).

> **Not:** GitHub Actions datacenter IP'leri Trendyol/Hepsiburada/Amazon tarafından
> engellenebilir. İlk cron çalışmasından sonra `/admin` sayfasını kontrol edin; gerekirse
> scraping'i kendi makinenizde zamanlayın veya proxy ekleyin.

## Deploy

1. **Supabase:** proje oluştur, `DATABASE_URL` (pooler, 6543) + `DIRECT_URL` (5432) al.
2. **Vercel:** repo'yu bağla, iki env değişkenini ekle. Build öncesi `prisma generate`
   `postinstall` script'iyle otomatik çalışır.
3. **GitHub:** repo Secrets'a `DATABASE_URL` ve `DIRECT_URL` ekle — `.github/workflows/scrape.yml`
   her gün 06:30 (TR) çalışır; Actions sekmesinden elle de tetiklenebilir.
