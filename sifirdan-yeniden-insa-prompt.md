# Fiyat Karşılaştırma Sitesi — Frontend'i Sıfırdan Yeniden İnşa

## Neden bu sefer farklı yapıyoruz
Önceki denemede sayfa sayfa ilerledik ve ortada tutarlı bir tasarım sistemi 
olmadı — sonuç amatörce göründü. Bu sefer ÖNCE bir tasarım sistemi kurup 
onaylatacağız, SONRA sayfaları o sistemin üstüne inşa edeceğiz. Sayfa yazmadan 
önce bileşen yazılacak.

## Kapsam
- **Korunacak:** Veritabanı şeması, scraper'lar, API route'ları, Prisma katmanı 
  (bunlar çalışıyor, dokunma)
- **Sıfırdan yazılacak:** Tüm frontend — components/, app/ altındaki sayfa 
  dosyaları, global stiller. Eski component'leri silebilir ya da referans için 
  ayrı bir klasöre taşıyabilirsin, ama yeni kodda kullanma.

## Referans His (kopyalamadan — sadece olgunluk/güven hissi için)
cimri.com'un genel yaklaşımı ana referansımız (aynı pazar, aynı kullanım 
senaryosu). PriceRunner ve Google Shopping da ikincil referans olarak 
düşünülebilir. Bu tarz olgun karşılaştırma sitelerinin ortak noktaları:
- Sade, bol boşluklu, kalabalık olmayan layout
- Az sayıda ama her yerde tutarlı kullanılan vurgu rengi
- Net tipografi hiyerarşisi — başlık, gövde metni ve fiyat birbirinden kolayca 
  ayrışıyor, fiyat her zaman görsel olarak en belirgin eleman
- Güven unsurları: mağaza sayısı, "X mağazada karşılaştırıldı" gibi somut 
  rakamlar, tutarlı rozet/etiket kullanımı
- Gereksiz animasyon, gölge, gradyan yok — her şey amacına hizmet ediyor

## FAZ 1 — Tasarım Sistemi (başka hiçbir şey yapma, önce bu)
Şunları izole bir şekilde kur:
1. Tailwind config: renk paleti (hardcoded hex DEĞİL, tema token'ları olarak — 
   `primary`, `accent`, `success`, `danger`, `surface`, `text-muted` gibi 
   isimlendirilmiş), tipografi ölçeği (başlık/gövde/caption/fiyat için ayrı 
   font-size ve font-family, fiyatlar için mono font)
2. Temel bileşen kütüphanesi (`components/ui/` altında), en azından:
   - Button (primary, secondary, ghost varyantları)
   - Badge (indirim, "en ucuz", durum rozetleri için)
   - Card (ürün kartı temel yapısı)
   - Input (arama çubuğu dahil)
   - PriceTag (eski fiyat üstü çizili + yeni fiyat, tutarlı bir bileşen olarak)
   - Navbar
   - CategoryChip
3. Bu bileşenleri gösteren basit bir "showcase" sayfası oluştur (örn. 
   `/design-system` route'u altında, sadece geliştirme amaçlı, prod'a 
   koymayacağız).

**Bu fazın sonunda dur.** Bana showcase sayfasının ekran görüntüsünü/açıklamasını 
göster, ben onaylamadan Faz 2'ye geçme.

## FAZ 2 — Sayfalar (SADECE Faz 1'deki onaylanmış bileşenlerle)
Bu sırayla ilerle, her sayfadan sonra dur ve onay bekle:
1. Ana sayfa (navbar + hero/karşılama alanı + kategoriler + fiyatı düşenler 
   bölümü)
2. Arama sonuçları / kategori sayfası
3. Ürün detay sayfası (fiyat karşılaştırma listesi + fiyat geçmişi grafiği)

Kural: Yeni bir sayfada ihtiyaç duyduğun bir UI parçası Faz 1'de yoksa, önce 
`components/ui/`'a ekle ve bana söyle — sayfanın içine gömülü, tek kullanımlık 
ad-hoc stil yazma. Bu, ileride tekrar "yamalı" görünmemizi engelleyecek tek şey.

## Genel Kurallar
- Mobile-first responsive kal
- next/font ile Google Fonts kullan (next/font/google), performans için
- next/image kullan, optimize edilmemiş `<img>` kullanma
- Her fazın sonunda ilerlemeyi özetle, bir sonraki adıma geçmeden onay iste
- Emin olmadığın bir tasarım kararında (örnek: bu buton primary mi secondary 
  mi olmalı) tahmin etme, sor
