# Proje: Genel Fiyat Karşılaştırma Sitesi

## Amaç
Farklı e-ticaret sitelerinden ürün fiyatlarını çekip tek bir platformda karşılaştıran, mobil uyumlu bir web sitesi geliştirmeni istiyorum. Site ileride React Native ile mobil app'e dönüştürülecek, bu yüzden mimariyi buna göre kur.

## Tech Stack
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Veritabanı:** PostgreSQL (Supabase üzerinde, ücretsiz tier)
- **ORM:** Prisma
- **Scraping:** Node.js/TypeScript scriptleri — her site için ayrı bir scraper dosyası
  - Basit HTML döndüren siteler için `cheerio` + `axios`/`fetch`
  - JS ile render edilen / bot korumalı siteler için `Playwright`
- **Zamanlama:** GitHub Actions (cron ile günde 1 kez) — Vercel Cron kullanma, hobby planında kısıtlı
- **Deployment:** Vercel (frontend + API routes), Supabase (DB)

## Mimari Gereksinimler (Mobil Taşınabilirlik İçin Önemli)
1. Tüm iş mantığını (fiyat karşılaştırma, veri normalizasyonu, API çağrıları, tip tanımları) `lib/` klasöründe, Next.js'e özel importlardan (next/navigation, next/image vb.) bağımsız, saf TypeScript fonksiyonları olarak yaz.
2. UI bileşenlerini (`components/`) bu mantıktan ayrı tut ki ileride React Native'de sadece UI katmanını değiştirip `lib/` katmanını olduğu gibi kullanabilelim.
3. Responsive tasarım mobile-first olsun (Tailwind'in `sm:`, `md:`, `lg:` breakpoint'lerini mobile-first mantığıyla kullan). Dokunmatik ekranlarda kullanılabilir buton/kart boyutları olsun.

## Veritabanı Şeması (öneri, gerekirse revize et)
- `Product`: id, name, normalized_name, category, image_url, created_at
- `PriceEntry`: id, product_id (FK), site_name, price, currency, product_url, scraped_at
- `Category`: id, name, slug

Amaç: Aynı ürünün farklı sitelerdeki fiyatlarını `PriceEntry` üzerinden eşleştirip karşılaştırmak.

## Özellikler
1. Ana sayfa: arama çubuğu + kategori bazlı gezinme + öne çıkan/indirimli ürünler
2. Arama sonucu sayfası: bir ürünün farklı sitelerdeki fiyatlarını kart/tablo halinde listele, en ucuzdan pahalıya sırala
3. Ürün detay sayfası: fiyat geçmişi grafiği (basit bir chart kütüphanesiyle, örn. recharts), "en ucuz burada" vurgusu, site linkine yönlendirme
4. Kategori sayfaları
5. Basit bir admin/log sayfası (opsiyonel): son scraping çalışmasının ne zaman yapıldığı, kaç ürün güncellendiği, hata olup olmadığı

## Scraping Kuralları (Önemli — Önce Bunları Uygula)
1. Scraper yazmadan önce, sana vereceğim site linklerini incele (fetch/browser ile), HTML yapısını analiz et, hangi yöntemin (basit fetch mi, Playwright mı) gerektiğine karar ver.
2. Her sitenin `robots.txt` dosyasını kontrol et, izin verilmeyen path'lere scraping yapma.
3. İstekler arasına makul gecikme (rate limiting) koy, siteyi yorma.
4. Gerçekçi bir `User-Agent` header kullan.
5. Hata yönetimi ve retry mekanizması ekle; bir site başarısız olursa diğerlerini etkilemesin.
6. Çekilen veriyi normalize et (fiyat formatı, para birimi, ürün adı temizliği) ki farklı sitelerden gelen aynı ürün eşleşebilsin.

## Şimdilik Kapsam Dışı (ama mimaride yer bırak)
- Kullanıcı hesapları / fiyat alarmı bildirimleri (ileride eklenecek)
- Çoklu dil desteği

## İlk Adım Olarak Senden İstediğim
1. Proje iskeletini oluştur (Next.js + TypeScript + Tailwind + Prisma kurulumu)
2. Prisma şemasını yukarıdaki modele göre kur ve Supabase'e bağlantıyı hazırla (bağlantı bilgilerini `.env` üzerinden alacak şekilde, hardcode etme)
3. Ben sana aşağıda [SITE LİNKLERİ] başlığı altında 2-4 sitenin arama sonucu ve ürün detay sayfası linklerini vereceğim — bunları incele ve her biri için uygun scraper yaklaşımını (cheerio mu Playwright mı) belirle, sonra scraper kodunu yaz
4. Ana sayfa ve arama sonucu sayfasının mobile-first responsive UI'ını oluştur
5. Her adımdan sonra bana ne yaptığını kısaca özetle, büyük mimari kararları önce bana sor

## [SITE LİNKLERİ]
Aşağıdakiler telefon kategorisi listeleme sayfaları (ürün detay linki değil). Her siteye git, listeleme sayfasındaki kart yapısını incele, oradan örnek 1 ürüne tıklayıp detay sayfasının HTML yapısını da incele. Sonra her site için scraping yaklaşımını (basit fetch/cheerio mi, Playwright mı) belirle.

1. Trendyol: https://www.trendyol.com/telefon-x-c104025
2. Hepsiburada: https://www.hepsiburada.com/telefonlar-c-2147483642
3. Amazon.com.tr: https://www.amazon.com.tr/b?node=13709907031
4. Vatan Bilgisayar: https://www.vatanbilgisayar.com/cep-telefonu-modelleri/
5. N11: https://www.n11.com/telefon-ve-aksesuarlari
