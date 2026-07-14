// Ürün başlığından kimlik çıkarımı: marka + model (kanonik kimlik) ve
// varyant imzası (depolama / RAM / renk). Saf TypeScript, dış bağımlılık yok.
//
// Tasarım: önce varyant nitelikleri başlığın TAMAMINDAN çıkarılır (Amazon
// pazarlama metnini virgülle ayırdığı için depolama/renk geç segmentlerde
// olabilir), model anahtarı ise yalnızca ilk [:,;] öncesi segmentten üretilir.

export interface VariantAttrs {
  storageGb: number | null;
  ramGb: number | null;
  /** Kanonik renk slug'ı, ör. "gok-mavisi". Bilinmiyorsa null. */
  color: string | null;
}

export interface ParsedProduct {
  /** Görünen marka adı (ör. "Apple"); tanınmadıysa null. */
  brand: string | null;
  /** Görünen model adı, varyant/gürültü ayıklanmış (ör. "iPhone 15 Pro Max"). */
  model: string;
  /** Eşleştirme anahtarı: marka+model token'ları, alfabetik. Varyant içermez. */
  modelKey: string;
  attrs: VariantAttrs;
  /** Telefon kategorisine ait olmayan aksesuar (kılıf, şarj aleti...) mı? */
  isAccessory: boolean;
}

/** Türkçe karakterleri ASCII karşılığına indirger (eşleştirme anahtarı için). */
export function foldTurkish(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

// ---------------------------------------------------------------------------
// Renk sözlüğü
// ---------------------------------------------------------------------------

/** Kanonik slug -> temel renk tonu (çıplak temel renkle eşleşme kararında kullanılır). */
const COLOR_BASE: Record<string, string> = {};

/** Katlanmış (folded) takma ad -> kanonik slug. Çok kelimeli anahtarlar boşlukludur. */
const COLOR_ALIAS: Record<string, string> = {};

function defColor(canonical: string, base: string, aliases: string[]) {
  COLOR_BASE[canonical] = base;
  for (const a of aliases) COLOR_ALIAS[a] = canonical;
  COLOR_ALIAS[canonical.replace(/-/g, ' ')] = canonical;
}

// Temel renkler (kendi kendilerinin temelidir)
defColor('siyah', 'siyah', ['black']);
defColor('beyaz', 'beyaz', ['white']);
defColor('mavi', 'mavi', ['blue']);
defColor('kirmizi', 'kirmizi', ['red']);
defColor('yesil', 'yesil', ['green']);
defColor('mor', 'mor', ['purple']);
defColor('pembe', 'pembe', ['pink']);
defColor('sari', 'sari', ['yellow']);
defColor('turuncu', 'turuncu', ['orange']);
defColor('gri', 'gri', ['gray', 'grey']);
defColor('gumus', 'gumus', ['silver']);
defColor('altin', 'altin', ['gold', 'dore']);
defColor('lacivert', 'mavi', ['navy', 'navy blue']);
defColor('kahverengi', 'kahverengi', ['brown']);
defColor('bej', 'bej', ['beige']);
defColor('krem', 'krem', ['cream']);
defColor('bordo', 'bordo', ['burgundy', 'maroon']);
defColor('bronz', 'bronz', ['bronze']);
defColor('sampanya', 'sampanya', ['champagne']);
defColor('titanyum', 'titanyum', ['titanium', 'titan']);
defColor('grafit', 'gri', ['graphite']);
defColor('antrasit', 'gri', ['anthracite']);
defColor('lila', 'mor', ['lilac']);
defColor('eflatun', 'mor', []);
defColor('lavanta', 'mor', ['lavender']);
defColor('nane', 'yesil', ['mint']);
defColor('turkuaz', 'mavi', ['turquoise', 'teal']);
// Üretici pazarlama renkleri (Apple, Samsung, Xiaomi...)
defColor('gece-yarisi', 'siyah', ['midnight']);
defColor('gece-siyahi', 'siyah', ['night black']);
defColor('fantom-siyah', 'siyah', ['phantom black']);
defColor('uzay-siyahi', 'siyah', ['space black']);
defColor('oniks-siyah', 'siyah', ['onyx black']);
defColor('yildiz-isigi', 'beyaz', ['starlight']);
defColor('buz-beyazi', 'beyaz', ['ice white']);
defColor('gok-mavisi', 'mavi', ['sky blue']);
defColor('buz-mavisi', 'mavi', ['ice blue', 'glacier blue', 'buzul mavisi']);
defColor('sis-mavisi', 'mavi', ['mist blue']);
defColor('gece-mavisi', 'mavi', ['midnight blue']);
// Apple TR "Koyu Mavi" (Deep Blue); bazı siteler "Abis" diyor. Xiaomi'nin sıradan
// "Koyu Mavi"si de buraya iner — aynı modelde iki farklı koyu mavi pratikte yok.
defColor('koyu-mavi', 'mavi', ['deep blue', 'abyss blue', 'abis']);
defColor('ada-cayi', 'yesil', ['sage']);
defColor('kozmik-turuncu', 'turuncu', ['cosmic orange']);
defColor('uzay-grisi', 'gri', ['space gray', 'space grey']);
defColor('roze-altin', 'altin', ['rose gold', 'roze', 'rose']);
defColor('natural-titanyum', 'titanyum', ['natural titanium', 'naturel titanyum', 'dogal titanyum']);
defColor('col-titanyumu', 'titanyum', ['desert titanium', 'col rengi']);

/** "mavisi" -> "mavi" gibi Türkçe iyelik biçimlerini temel renge indirger. */
const POSSESSIVE: Record<string, string> = {
  mavisi: 'mavi',
  grisi: 'gri',
  siyahi: 'siyah',
  beyazi: 'beyaz',
  yesili: 'yesil',
  kirmizisi: 'kirmizi',
  moru: 'mor',
  turuncusu: 'turuncu',
  sarisi: 'sari',
  pembesi: 'pembe',
  altini: 'altin',
  titanyumu: 'titanyum',
};

/** "koyu mavi", "açık mor", "titanyum gri" gibi ön ek + temel renk bileşimleri. */
const COLOR_MODIFIERS = new Set([
  'koyu', 'acik', 'titanyum', 'buz', 'gece', 'uzay', 'sis', 'gok', 'kozmik',
  'fantom', 'mat', 'parlak', 'metalik', 'pastel', 'kobalt', 'safir', 'mercan',
]);

export function colorBaseOf(canonical: string | null): string | null {
  if (!canonical) return null;
  return COLOR_BASE[canonical] ?? null;
}

/** Renk çıplak temel renk mi ("mavi"), yoksa nitelenmiş mi ("sis-mavisi")? */
export function isBareBaseColor(canonical: string): boolean {
  return COLOR_BASE[canonical] === canonical;
}

// ---------------------------------------------------------------------------
// Marka sözlüğü
// ---------------------------------------------------------------------------

/** Katlanmış token -> görünen marka adı. */
const BRANDS: Record<string, string> = {
  // telefon
  apple: 'Apple', samsung: 'Samsung', xiaomi: 'Xiaomi', huawei: 'Huawei',
  oppo: 'Oppo', vivo: 'Vivo', realme: 'Realme', tecno: 'Tecno',
  infinix: 'Infinix', honor: 'Honor', reeder: 'Reeder', casper: 'Casper',
  oneplus: 'OnePlus', nothing: 'Nothing', motorola: 'Motorola', nokia: 'Nokia',
  tcl: 'TCL', omix: 'Omix', lenovo: 'Lenovo', asus: 'Asus', sony: 'Sony',
  // laptop
  hp: 'HP', dell: 'Dell', acer: 'Acer', msi: 'MSI', monster: 'Monster',
  gigabyte: 'Gigabyte', toshiba: 'Toshiba', fujitsu: 'Fujitsu',
  // kulaklık / ses
  jbl: 'JBL', bose: 'Bose', anker: 'Anker', soundcore: 'Anker',
  sennheiser: 'Sennheiser', jabra: 'Jabra', edifier: 'Edifier', haylou: 'Haylou',
  baseus: 'Baseus', ttec: 'Ttec', qcy: 'QCY', marshall: 'Marshall',
  logitech: 'Logitech', razer: 'Razer', steelseries: 'SteelSeries',
  rampage: 'Rampage', havit: 'Havit', beats: 'Beats',
  // ev aletleri
  philips: 'Philips', arzum: 'Arzum', tefal: 'Tefal', braun: 'Braun',
  bosch: 'Bosch', siemens: 'Siemens', arcelik: 'Arçelik', beko: 'Beko',
  vestel: 'Vestel', fakir: 'Fakir', sinbo: 'Sinbo', karaca: 'Karaca',
  dyson: 'Dyson', roborock: 'Roborock', dreame: 'Dreame', rowenta: 'Rowenta',
  kenwood: 'Kenwood', delonghi: 'DeLonghi', grundig: 'Grundig', profilo: 'Profilo',
  kiwi: 'Kiwi', korkmaz: 'Korkmaz', schafer: 'Schafer', kumtel: 'Kumtel',
  // kozmetik / kişisel bakım
  bargello: 'Bargello', nivea: 'Nivea', loreal: "L'Oréal", maybelline: 'Maybelline',
  rexona: 'Rexona', avene: 'Avène', garnier: 'Garnier', bioderma: 'Bioderma',
  vichy: 'Vichy', eucerin: 'Eucerin', neutrogena: 'Neutrogena', bepanthol: 'Bepanthol',
  dove: 'Dove', flormar: 'Flormar', cerave: 'CeraVe', pantene: 'Pantene',
  // süpermarket
  nutella: 'Nutella', fairy: 'Fairy', finish: 'Finish', ariel: 'Ariel',
  persil: 'Persil', domestos: 'Domestos', cif: 'Cif', omo: 'Omo',
  solo: 'Solo', selpak: 'Selpak', lipton: 'Lipton', nescafe: 'Nescafé',
  jacobs: 'Jacobs', ulker: 'Ülker', eti: 'Eti', torku: 'Torku',
  pinar: 'Pınar', sutas: 'Sütaş', tadim: 'Tadım', doritos: 'Doritos',
  pepsi: 'Pepsi', ruffles: 'Ruffles',
  // petshop
  purina: 'Purina', proplan: 'Pro Plan', whiskas: 'Whiskas', felix: 'Felix',
  bonnie: 'Bonnie', reflex: 'Reflex', gourmet: 'Gourmet', acana: 'Acana', brit: 'Brit',
  // moda / saat / ayakkabı
  casio: 'Casio', seiko: 'Seiko', citizen: 'Citizen', fossil: 'Fossil',
  festina: 'Festina', orient: 'Orient', swatch: 'Swatch', timex: 'Timex',
  guess: 'Guess', curren: 'Curren', naviforce: 'Naviforce',
  adidas: 'Adidas', puma: 'Puma', nike: 'Nike', skechers: 'Skechers',
  hummel: 'Hummel', kinetix: 'Kinetix', lumberjack: 'Lumberjack',
  converse: 'Converse', vans: 'Vans', reebok: 'Reebok', lescon: 'Lescon',
  // spor / outdoor
  domyos: 'Domyos', voit: 'Voit', altis: 'Altis', everlast: 'Everlast', stanley: 'Stanley',
  akaso: 'Akaso', ecgspor: 'Ecgspor', salomon: 'Salomon', koctas: 'Koçtaş',
  muggo: 'Muggo', quiksilver: 'Quiksilver', defacto: 'DeFacto', dji: 'DJI', akut: 'AKUT',
  // anne & bebek
  prima: 'Prima', pampers: 'Pampers', molfix: 'Molfix', sleepy: 'Sleepy',
  huggies: 'Huggies', chicco: 'Chicco', lego: 'LEGO', barbie: 'Barbie',
  // ev & yaşam
  pasabahce: 'Paşabahçe', lav: 'LAV', emsan: 'Emsan', keramika: 'Keramika',
  ozdilek: 'Özdilek', bernardo: 'Bernardo',
  // oto / bahçe / yapı market
  makita: 'Makita', dewalt: 'DeWalt', karcher: 'Kärcher', einhell: 'Einhell',
  gardena: 'Gardena', knipex: 'Knipex', michelin: 'Michelin',
};

/** Alt marka/seri -> ana marka: bir site markayı yazarken diğeri atlayabiliyor. */
const BRAND_IMPLIES: Record<string, string> = {
  iphone: 'apple',
  galaxy: 'samsung',
  redmi: 'xiaomi',
  poco: 'xiaomi',
};

// ---------------------------------------------------------------------------
// Kapasite (depolama / RAM) çıkarımı
// ---------------------------------------------------------------------------

const RAM_SET = new Set([1, 2, 3, 4, 6, 8, 10, 12, 16, 18, 24, 32, 64]);
const STORAGE_SET = new Set([16, 32, 64, 128, 256, 512, 1024, 2048]);

function toGb(value: number, unit: string): number {
  return unit === 'tb' ? value * 1024 : value;
}

interface CapacityScan {
  storageGb: number | null;
  ramGb: number | null;
  /** Başlıktan silinecek eşleşme aralıkları (model anahtarını kirletmesinler). */
  cleaned: string;
}

/**
 * Katlanmış başlıktan depolama ve RAM çıkarır.
 * Sıra: açık işaretli ("8GB RAM", "256GB ROM/Hafıza/Depolama") -> çift kalıbı
 * ("4/128 GB", "8+256 GB", "8G+256G") -> tekil kapasiteler (geçerlilik kümesiyle).
 */
function scanCapacity(folded: string): CapacityScan {
  let s = folded;
  let storageGb: number | null = null;
  let ramGb: number | null = null;

  // 1) Açık işaretli değerler ("16GB DDR5 RAM", "512G SSD", "256GB Hafıza")
  s = s.replace(/\b(\d+)\s*(gb|tb|g)\s*(?:ddr\d\w*\s+)?(ram|bellek)\b/g, (_, v, u) => {
    ramGb ??= toGb(Number(v), u === 'tb' ? 'tb' : 'gb');
    return ' ';
  });
  s = s.replace(/\b(\d+)\s*(gb|tb|g)\s*(rom|hafiza|depolama|dahili|ssd|hdd|nvme|emmc)\b/g, (_, v, u) => {
    storageGb ??= toGb(Number(v), u === 'tb' ? 'tb' : 'gb');
    return ' ';
  });

  // 2) Çift kalıbı: "4/128 gb", "8 + 256 gb", "8gb+256gb", "8g+256g", "16/512"
  s = s.replace(
    /\b(\d+)\s*(gb|tb|g)?\s*[/+]\s*(\d+)\s*(gb|tb|g)?\b/g,
    (m, v1, u1, v2, u2) => {
      const a = toGb(Number(v1), u1 === 'tb' ? 'tb' : 'gb');
      const b = toGb(Number(v2), u2 === 'tb' ? 'tb' : 'gb');
      const [ram, storage] = a <= b ? [a, b] : [b, a];
      // Birimsiz çiftlerde ("15/14" gibi model adları!) geçerlilik kümesi şart.
      if (!RAM_SET.has(ram) || !STORAGE_SET.has(storage)) return m;
      ramGb ??= ram;
      storageGb ??= storage;
      return ' ';
    },
  );

  // 3) Tekil kapasiteler
  const singles: number[] = [];
  s = s.replace(/\b(\d+)\s*(gb|tb)\b/g, (m, v, u) => {
    const gb = toGb(Number(v), u);
    if (!RAM_SET.has(gb) && !STORAGE_SET.has(gb)) return m; // 5000 mah vb. değil ama garip değerleri bırak
    singles.push(gb);
    return ' ';
  });
  // Laptop kısaltması "8G" (birimsiz g): 4G/5G bağlantı adlarıyla karışmasın diye >=6.
  s = s.replace(/\b(\d+)\s*g\b/g, (m, v) => {
    const gb = Number(v);
    if (gb < 6 || (!RAM_SET.has(gb) && !STORAGE_SET.has(gb))) return m;
    singles.push(gb);
    return ' ';
  });
  if (singles.length >= 2 && storageGb === null && ramGb === null) {
    const sorted = [...singles].sort((a, b) => a - b);
    const [small, large] = [sorted[0], sorted[sorted.length - 1]];
    if (RAM_SET.has(small) && STORAGE_SET.has(large) && small < large) {
      ramGb = small;
      storageGb = large;
    }
  } else if (singles.length === 1) {
    const v = singles[0];
    if (v >= 32 && STORAGE_SET.has(v)) storageGb ??= v;
    else if (RAM_SET.has(v)) ramGb ??= v;
  }

  return { storageGb, ramGb, cleaned: s };
}

// ---------------------------------------------------------------------------
// Renk çıkarımı
// ---------------------------------------------------------------------------

interface ColorScan {
  color: string | null;
  cleaned: string;
}

/** Token'ı temel renk adına indirger (iyelik eki dahil); renk değilse null. */
function asBaseColorToken(token: string): string | null {
  const t = POSSESSIVE[token] ?? token;
  if (COLOR_BASE[t] === t) return t; // yalnızca çıplak temel renkler
  return null;
}

/** i konumunda başlayan en uzun renk eşleşmesi; yoksa null. */
function matchColorAt(tokens: string[], i: number): { len: number; canonical: string } | null {
  // 1) Çok kelimeli sözlük ifadesi (uzun olan öncelikli)
  for (const len of [3, 2]) {
    if (i + len > tokens.length) continue;
    const canonical = COLOR_ALIAS[tokens.slice(i, i + len).join(' ')];
    if (canonical) return { len, canonical };
  }
  // 2) Niteleyici + temel renk bileşimi: "koyu mavi", "titanyum gri", "açık mor"
  if (COLOR_MODIFIERS.has(tokens[i]) && i + 1 < tokens.length) {
    const base = asBaseColorToken(tokens[i + 1]);
    if (base) {
      // Sözlükte iyelikli hali varsa ("gök mavisi") kanonik olarak onu kullan;
      // böylece "Gök Mavi" ve "Gök Mavisi" aynı slug'a iner.
      for (const suffix of ['si', 'i', 'u', 'su']) {
        const dictCanonical = COLOR_ALIAS[`${tokens[i]} ${base}${suffix}`];
        if (dictCanonical) return { len: 2, canonical: dictCanonical };
      }
      const canonical = `${tokens[i]}-${base}`;
      if (!(canonical in COLOR_BASE)) COLOR_BASE[canonical] = base;
      return { len: 2, canonical };
    }
  }
  // 3) Tekil token: sözlük takma adı ya da (iyelikli) temel renk
  const single = COLOR_ALIAS[tokens[i]] ?? asBaseColorToken(tokens[i]);
  return single ? { len: 1, canonical: single } : null;
}

/**
 * Katlanmış başlıkta renk ifadelerini bulur. Kanonik renk SON eşleşmedir
 * (renk hemen hep sondadır; baştaki eşleşmeler "Redmi..." gibi model
 * parçalarıyla karışabilir) — ama moda/spor gibi kategorilerde site'ler
 * renk adını başlıkta İKİ KEZ geçiriyor (ör. "... Taxer Walk Mavi Erkek
 * Şort Mavi"): yalnızca sonuncuyu silmek ilkini modelKey'de bırakır ve aynı
 * ürünün farklı renkleri "sahte farklı model" gibi görünüp eşleşmeyi
 * bozar (Dice benzerliği düşer). Bulunan TÜM renk aralıkları temizlenir.
 */
function scanColor(folded: string): ColorScan {
  const tokens = folded.split(/\s+/).filter(Boolean);
  const ranges: { start: number; len: number }[] = [];
  let canonical: string | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const m = matchColorAt(tokens, i);
    if (m) {
      canonical = m.canonical; // en son eşleşme kanonik renk kabul edilir
      ranges.push({ start: i, len: m.len });
      i += m.len - 1; // eşleşen ifadenin içinden ikinci kez başlama
    }
  }

  if (!canonical) return { color: null, cleaned: folded };
  const kept = tokens.filter((_, idx) => !ranges.some((r) => idx >= r.start && idx < r.start + r.len));
  return { color: canonical, cleaned: kept.join(' ') };
}

/** Yapılandırılmış alanlardan gelen serbest renk metnini kanonik slug'a çevirir. */
export function canonicalColor(raw: string): string | null {
  return scanColor(foldTurkish(raw).replace(/[^a-z0-9]+/g, ' ')).color;
}

// ---------------------------------------------------------------------------
// Aksesuar filtresi (kategoriye göre)
// ---------------------------------------------------------------------------

/** Telefon kategorisinde ürün OLMADIĞINI gösteren ifadeler (katlanmış). */
// Dikkat: ürünlerin pazarlama metinleri "selfie kamera", "6000 mAh batarya"
// gibi ifadeler içerir — kalıplar tek başına bu kelimelere değil, yalnızca
// aksesuara özgü bileşimlere tetiklenmelidir. Kalıplar kategoriye özeldir:
// "kulaklık" telefon kategorisinde aksesuar, kulaklık kategorisinde ürünün ta kendisidir.

/**
 * Her kategoride aksesuar sayılan ifadeler. Dikkat: "ile uyumlu" burada DEĞİL —
 * kulaklıklar "Tüm Telefonlar ile Uyumlu" diye kendilerini tanıtır; o kalıp
 * yalnızca kulaklık DIŞI kategorilere eklenir.
 */
const GENERIC_ACCESSORY_PATTERNS: RegExp[] = [
  /\bcable\b/,
  // "(Dönüştürücü dahil değildir)" gibi olumsuzlamalar ürünün kendisini anlatmaz.
  /\bdonusturucu(?!\s+(dahil degildir|haric))/, /\bcevirici(?!\s+(dahil degildir|haric))/,
  /\btakip cihazi/, /\bsmart tag/, /\bsmarttag/, /\bairtag/, /\bakilli takip/,
];

/** "X ile uyumlu ..." veya "X uyumlu ..." başlıkları: çoğu kategoride yedek parça/aksesuar işareti. */
const COMPAT_PATTERN = /\b(ile\s+)?uyumlu\b/;

/**
 * COMPAT_PATTERN'in aksesuar SAYILMADIĞI kategoriler: kulaklıklar kendilerini
 * "Tüm Telefonlar ile Uyumlu" diye tanıtır; oto/bahçe/yapı markette ürünün
 * kendisi zaten bir araca/modele uyumluluk bildirir ("Ford Focus ile uyumlu paspas").
 */
const COMPAT_EXEMPT = new Set(['kulaklik', 'oto-bahce-yapi']);

const ACCESSORY_PATTERNS: Record<string, RegExp[]> = {
  telefon: [
    /\bkilif/, /\bkilifi\b/, /\bmagsafe\b/, /\bsilikon\b/, /\bkamera koruma/, /\barkalik\b/,
    /\bekran koruyucu/, /\bcam koruyucu/, /\bkoruyucu\b/, /\btemperli/,
    /\bkirilmaz\b/, /\bsarj aleti/, /\bsarj cihazi/, /\bsarj kablo/, /\bguc adaptoru/,
    /\badaptor/, /\bpowerbank/, /\bpower bank/, /\btasinabilir sarj/, /\bkablo\b/,
    /\bkablosu\b/, /\btutucu/, /\bstand\b/, /\bstandi\b/, /\bkulaklik/, /\bkulakici/,
    /\bheadset/, /\bhoparlor/, /\bselfie cubugu/, /\btripod/, /\baparat/, /\bcubugu/,
    /\bhafiza karti/, /\bsd kart/, /\busb bellek/, /\botg\b/, /\byedek pil/,
    /\byedek batarya/, /\bakilli saat/, /\bsmartwatch/, /\bbileklik/, /\bkordon/,
    /\bkayis/, /\bcerceve/, /\bkaplama/, /\blens\b/, /\bmikrofon/, /\barac ici/,
    /\bsarj standi/, /\bsim kart soket/,
    // Yedek parça/tamir ürünleri: "Ekran Dokunmatik OLED", "Batarya Pil Kapasite"...
    /\bdokunmatik\b/, /\bbatarya pil\b/, /\bpil kapasite/, /\bsogutucu/,
    // Başlığında "kulaklık" geçmeyen kulaklık serileri (AirPods, Buds...) telefon değildir.
    /\bairpods\b/, /\bfreebuds\b/, /\bbuds\b/, /\bearbuds\b/,
  ],
  laptop: [
    /\bkilif/, /\bcanta/, /\bsirt cantasi/, /\bsogutucu/, /\bsogutma/, /\bstand\b/,
    /\bstandi\b/, /\bmouse\b/, /\bfare\b/, /\bhub\b/, /\bcevirici/, /\bcoklayici/,
    /\badaptor/, /\bsarj aleti/, /\bsarj cihazi/, /\bkablo\b/, /\bkablosu\b/,
    /\bekran koruyucu/, /\btemperli/, /\bkaplama/, /\bsticker/, /\bklavye koruyucu/,
    /\bram bellek\b/, /\busb bellek/, /\bhafiza karti/, /\bdock\b/,
  ],
  // Kulaklıkta "ped/sünger" ürün özelliği olarak da geçer ("Yumuşak Kulak Pedli") —
  // yalnızca açıkça yedek/aparat bildiren kalıplar kullanılır.
  kulaklik: [
    /\bkilif/, /\bkanca/, /\baski\b/, /\baparat/, /\byedek\b/, /\btemizleme/,
    /\bstand\b/, /\bstandi\b/, /\btutucu/, /\bkordon/, /\bkulak yastigi/, /\beartip/,
    /\bsilikon kapak/,
  ],
  'ev-aletleri': [
    /\bfiltre/, /\btorba/, /\bhortum/, /\byedek\b/, /\bbakim paketi/, /\bbakim seti/,
    /\baksesuar seti/, /\bfircasi\b/, /\bbasligi\b/, /\bbicagi\b/, /\bkartus/,
    /\bkese\b/, /\bkapsul/, /\btemizleme tableti/, /\bkirec onleyici/,
  ],
  // Yeni kategoriler (Faz 3): kalıplar bilinçli olarak dar — geniş listelemelerde
  // hemen her şey kategorinin meşru ürünüdür, yalnızca açık yedek parça/aparat elenir.
  'ev-yasam': [/\byedek parca/, /\bmontaj kiti/, /\bmontaj aparati/],
  'anne-bebek': [/\byedek parca/, /\byedek emzik ucu/],
  // Saat listelerinde kordon/kayış/pil, ayakkabıda bağcık/tabanlık/boya aksesuar işaretidir.
  moda: [
    /\bkordon\b/, /\bkordonu\b/, /\bkayis\b/, /\bkayisi\b/, /\bsaat pili/, /\bsaat kutusu/,
    /\bbagcik/, /\btabanlik/, /\bayakkabi boyasi/, /\bayakkabi bakim/, /\bcanta askisi/,
  ],
  'kitap-muzik-hobi': [/\bkitap ayraci/, /\bkitap kilifi/, /\bkitap standi/, /\bkitap tutucu/],
  'spor-outdoor': [/\byedek parca/],
  // Vatan'ın kişisel bakım listesi elektrikli cihaz yedeklerini de içeriyor
  // ("One Blade Yedek Bıçak") — canlı dry-run'da görüldü.
  kozmetik: [
    /\bbos sise/, /\bbos kavanoz/, /\bdoldurulabilir sise/, /\bmakyaj cantasi/,
    /\bkozmetik cantasi/, /\byedek bicak/, /\byedek baslik/, /\byedek epilasyon basligi/,
  ],
  'oto-bahce-yapi': [],
  petshop: [],
  supermarket: [],
};

/** Kategori slug'ına göre "bu başlık bu kategorinin ürünü değil" kararı. */
export function isAccessoryTitle(categorySlug: string, foldedTitle: string): boolean {
  const patterns = ACCESSORY_PATTERNS[categorySlug];
  if (!patterns) return false;
  if (!COMPAT_EXEMPT.has(categorySlug) && COMPAT_PATTERN.test(foldedTitle)) return true;
  return [...GENERIC_ACCESSORY_PATTERNS, ...patterns].some((p) => p.test(foldedTitle));
}

// ---------------------------------------------------------------------------
// Model anahtarı ve tam ayrıştırma
// ---------------------------------------------------------------------------

/** Anlam taşımayan ya da siteden siteye tutarsız olan token'lar. */
const NOISE_TOKENS = new Set([
  'akilli', 'cep', 'telefon', 'telefonu', 'android', 'ios', 'smartphone',
  'yeni', 'model', 'tr', 'turkiye', 'garantili', 'garanti', 'resmi',
  'distributor', 'distribitor', 'ithalatci', 'ram', 'rom', 'hafiza', 'bellek',
  'depolama', 'dahili', '5g', '4g', 'lte', 'katlanabilir', 'gb', 'tb',
  // laptop/kulaklık/ev aletleri listelerinde siteden siteye değişen dolgular
  'laptop', 'notebook', 'dizustu', 'bilgisayar', 'tasinabilir', 'ssd', 'hdd',
  'nvme', 'fhd', 'uhd', 'wuxga', 'ips', 'freedos', 'windows', 'ekran',
  'kablosuz', 'kulakici', 'kulakustu', 'bluetooth', 'tws', 'kulaklik', 'mikrofonlu',
  'kulak', 'ustu', 'ici',
]);

/** Ölçü ifadeleri ("6.7 inç", "120 Hz", "5000 mAh"...): model anahtarını kirletmesin. */
const MEASURE_PATTERN = /\b\d+([.,]\d+)?\s*(inc|inch|hz|fps|mah|mp|mm|cm|w|nit|l|lt|litre|ml|kg|bar|rpm|devir)\b/g;

/** Birimsiz ondalık sayılar ("15.6", "14.5" ekran boyutları) model token'ı olamaz. */
const BARE_DECIMAL_PATTERN = /\b\d+[.,]\d+\b/g;

/** "s26plus" -> "s26 plus": bitişik yazılmış bilinen model son ekleri ayrılır. */
const GLUED_SUFFIXES = ['plus', 'pro', 'max', 'ultra', 'mini', 'lite', 'fe'];
function splitGluedSuffix(token: string): string[] {
  for (const suf of GLUED_SUFFIXES) {
    if (token.length > suf.length && token.endsWith(suf)) {
      const head = token.slice(0, -suf.length);
      if (/\d$/.test(head)) return [head, suf];
    }
  }
  return [token];
}

export interface ParseOptions {
  /** Scraper'ın yapılandırılmış alanlardan getirdiği nitelikler (başlığa üstün gelir). */
  attrHints?: Partial<VariantAttrs>;
  categorySlug?: string;
}

export function parseProductTitle(title: string, opts: ParseOptions = {}): ParsedProduct {
  const categorySlug = opts.categorySlug ?? 'telefon';
  let folded = foldTurkish(title);
  folded = folded.replace(/\d+\s*yildiz uzerinden.*$/g, ' '); // Amazon puan bloğu artığı
  folded = folded.replace(/\b(\d+)(gb|tb|mah|mp|hz|w)\b/g, '$1 $2'); // "128gb" -> "128 gb"

  // Nitelik kaynağı: parantez İÇERİKLERİ korunur — kapasite/renk parantezte
  // olabilir: "Galaxy A07 5G (4GB RAM, 128GB Depolama) ... (MOR)".
  const attrsSrc = folded
    .replace(/[()[\]]/g, ' ')
    .replace(/[^a-z0-9/+.,:;|-]+/g, ' ')
    .replace(MEASURE_PATTERN, ' ');

  const isAccessory = isAccessoryTitle(categorySlug, attrsSrc);

  const capacity = scanCapacity(attrsSrc);
  const colorScan = scanColor(capacity.cleaned.replace(/[/+.,:;|-]/g, ' '));

  const attrs: VariantAttrs = {
    storageGb: opts.attrHints?.storageGb ?? capacity.storageGb,
    ramGb: opts.attrHints?.ramGb ?? capacity.ramGb,
    color: opts.attrHints?.color ?? colorScan.color,
  };

  // Model segmenti: parantezler içerikleriyle atılır, kapasite temizlenir,
  // ilk [:;,|] öncesi alınır (Amazon pazarlama metni bu ayraçlardan sonra gelir).
  const modelSrc = folded
    .replace(/\(.*?\)/g, ' ')
    .replace(/\[.*?\]/g, ' ')
    .replace(/[^a-z0-9/+.,:;|-]+/g, ' ')
    .replace(MEASURE_PATTERN, ' ')
    .replace(BARE_DECIMAL_PATTERN, ' ')
    .replace(/\bwindows\s*1[01]\b|\bwin\s*1[01]\b/g, ' ')
    .replace(/\bresmi\s+distribut[oe]r\b/g, ' ');
  const segment = firstSegment(scanCapacity(modelSrc).cleaned);
  const segColor = scanColor(segment.replace(/[/+.-]/g, ' '));
  const tokens = segColor.cleaned
    .replace(/([a-z])\+/g, '$1 plus') // "Pro+" -> "pro plus" ("+" kaybolmasın)
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)
    .flatMap(splitGluedSuffix)
    .filter((t) => t && !NOISE_TOKENS.has(t) && !/^\d+\s*(gb|tb)$/.test(t));

  // Marka tespiti + alt marka çıkarımı
  let brandToken: string | null = null;
  for (const t of tokens) {
    if (BRANDS[t]) {
      brandToken = t;
      break;
    }
  }
  for (const [sub, brand] of Object.entries(BRAND_IMPLIES)) {
    if (tokens.includes(sub)) {
      if (!tokens.includes(brand)) tokens.push(brand);
      brandToken ??= brand;
    }
  }

  const uniq = [...new Set(tokens)];
  const modelKey = [...uniq].sort().join(' ');
  const modelTokens = uniq.filter((t) => t !== brandToken);

  return {
    brand: brandToken ? BRANDS[brandToken] : null,
    model: modelTokens.join(' '),
    modelKey,
    attrs,
    isAccessory,
  };
}

/** Katlanmış metnin ilk [:;,|] öncesi model segmenti. */
function firstSegment(cleaned: string): string {
  const cut = cleaned.split(/[:;,|]/)[0] ?? cleaned;
  // Segment aşırı kısaldıysa (ör. başlık ":" ile başlıyorsa) tamamına dön.
  return cut.trim().split(/\s+/).length >= 2 ? cut : cleaned;
}

// ---------------------------------------------------------------------------
// Varyant anahtarı ve benzerlik
// ---------------------------------------------------------------------------

// Varyant anahtarı üretimi lib/attributes.ts'e taşındı (variantKeyFor):
// imza artık kategoriye göre tanımlı nitelik kümesinden türetilir.

/** Varyantın insan-okur etiketi: "128 GB · 8 GB RAM · Mavi" gibi. */
export function variantLabel(attrs: VariantAttrs): string {
  const parts: string[] = [];
  if (attrs.storageGb) parts.push(attrs.storageGb >= 1024 ? `${attrs.storageGb / 1024} TB` : `${attrs.storageGb} GB`);
  if (attrs.ramGb) parts.push(`${attrs.ramGb} GB RAM`);
  if (attrs.color) parts.push(attrs.color.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
  return parts.join(' · ');
}

/** Arama anahtarı: modelKey token'ları + varyant token'ları, alfabetik. */
export function searchKeyOf(modelKey: string, attrs: VariantAttrs): string {
  const tokens = new Set(modelKey.split(' ').filter(Boolean));
  if (attrs.storageGb) tokens.add(String(attrs.storageGb));
  if (attrs.ramGb) tokens.add(String(attrs.ramGb));
  if (attrs.color) for (const t of attrs.color.split('-')) tokens.add(t);
  return [...tokens].sort().join(' ');
}

/** Token kümesi Dice benzerliği: 2|A∩B| / (|A|+|B|). */
export function diceSimilarity(keyA: string, keyB: string): number {
  const a = new Set(keyA.split(' ').filter(Boolean));
  const b = new Set(keyB.split(' ').filter(Boolean));
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  for (const t of a) if (b.has(t)) common++;
  return (2 * common) / (a.size + b.size);
}
