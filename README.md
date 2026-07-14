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
2. **Vercel:** repo'yu bağla (framework Next.js otomatik algılanır, `vercel.json` gerekmez).
   Aşağıdaki env değişkenlerini ekle. Build öncesi `prisma generate` `postinstall`
   script'iyle otomatik çalışır.
3. İlk deploy bitince Vercel'in verdiği `*.vercel.app` adresini `NEXT_PUBLIC_SITE_URL`'e
   yazıp **yeniden deploy et** (bu değer build'e gömülür, sonradan env değiştirmek
   tek başına yetmez).
4. **GitHub Secrets** (repo Settings → Secrets and variables → Actions) — `.github/workflows/scrape.yml`
   her gün 06:30 (TR) bunları kullanır; Actions sekmesinden elle de tetiklenebilir.

### Vercel ortam değişkenleri

| Değişken | Zorunlu mu | Not |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase pooler, 6543, `pgbouncer=true` |
| `DIRECT_URL` | ✅ | Supabase direct, 5432 |
| `AUTH_SECRET` | ✅ | Kullanıcı oturum çerezini imzalar — rastgele 32+ bayt |
| `NEXT_PUBLIC_SITE_URL` | ✅ | sitemap/robots/canonical/OG için (bkz. adım 3) |
| `ADMIN_PASSWORD` | ✅ | `/admin` paneli şifresi — `.env.example`'daki `change-me`'yi değiştirin |
| `GITHUB_ACTIONS_TOKEN` | Admin panelden scrape tetiklemek isteniyorsa | Fine-grained PAT, yalnızca bu repo, "Actions: Read and write" |
| `RESEND_API_KEY` + `EMAIL_FROM` | Gerçek e-posta göndermek için | Yoksa şifre sıfırlama/fiyat alarmı e-postaları konsola yazılır (Vercel loglarında görünür, kullanıcıya ulaşmaz) |
| `REVALIDATE_TOKEN` | Öneri | `REVALIDATE_URL` ile birlikte GitHub Secrets'a da eklenmeli (aşağıya bakın) |
| `ERROR_WEBHOOK_URL` | Opsiyonel | Sunucu hatalarını bir Discord/Slack webhook'una bildirir |
| `AFFILIATE_<SITE>_PARAMS` | Opsiyonel | Ortaklık programına üye olunca eklenir; yoksa linkler değişmeden kalır |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Opsiyonel | Gizlilik/KVKK sayfalarında gösterilir |

### GitHub Secrets (scrape cron için)

| Secret | Not |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Vercel'dekiyle aynı |
| `REVALIDATE_URL` | `https://<domain>/api/revalidate` — scrape bitince Vercel'in 1 saatlik cache'ini beklemeden düşürür |
| `REVALIDATE_TOKEN` | Vercel'e eklediğiniz `REVALIDATE_TOKEN` ile **birebir aynı** olmalı |

Deploy sonrası doğrulama: `/sitemap.xml` ve `/robots.txt`'nin gerçek domainle döndüğünü,
`npm run scrape -- --dry` ile scraper'ın çalıştığını, `/admin`'e yeni `ADMIN_PASSWORD` ile
giriş yapılabildiğini kontrol edin.
