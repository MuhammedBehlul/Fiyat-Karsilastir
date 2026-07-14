import Link from 'next/link';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Keşfet',
    links: [
      { label: 'İndirimdekiler', href: '/indirimdekiler' },
      { label: 'Karşılaştırma', href: '/karsilastir' },
      { label: 'Nasıl çalışır', href: '/nasil-calisir' },
    ],
  },
  {
    title: 'Hesap',
    links: [
      { label: 'Giriş yap', href: '/giris' },
      { label: 'Kayıt ol', href: '/kayit' },
      { label: 'Favorilerim', href: '/favorilerim' },
      { label: 'Fiyat alarmlarım', href: '/alarmlarim' },
    ],
  },
  {
    title: 'Yasal',
    links: [
      { label: 'Gizlilik Politikası', href: '/gizlilik' },
      { label: 'KVKK Aydınlatma Metni', href: '/kvkk' },
      { label: 'Çerez Politikası', href: '/cerez-politikasi' },
      { label: 'Kullanım Koşulları', href: '/kullanim-kosullari' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="col-span-2 md:col-span-1">
          <span className="font-heading text-lg font-bold tracking-tight text-text">
            Fiyat<span className="text-primary">Karşılaştır</span>
          </span>
          <p className="mt-2 max-w-xs text-caption leading-relaxed text-muted">
            Trendyol, Hepsiburada, Amazon, Vatan ve N11 fiyatlarını tek ekranda karşılaştırın.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 font-heading text-caption font-bold uppercase tracking-wider text-muted">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-body-sm text-text transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-6 text-center text-caption text-muted sm:px-6 lg:px-8">
          <p>
            Fiyatlar günde bir kez ilgili sitelerden otomatik derlenir; satın alma öncesi güncel
            fiyatı satıcı sitesinde doğrulayın.
          </p>
          <p className="flex items-center justify-center gap-3">
            <span>© {new Date().getFullYear()} FiyatKarşılaştır</span>
            <Link href="/admin" className="hover:text-primary">
              Yönetim
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
