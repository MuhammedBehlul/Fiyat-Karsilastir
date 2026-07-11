export const metadata = { title: 'Nasıl çalışır' };

const STEPS = [
  {
    title: 'Tarama',
    text: 'Trendyol, Hepsiburada, Amazon, Vatan Bilgisayar ve N11’den fiyatlar her gün otomatik olarak çekilir.',
  },
  {
    title: 'Eşleştirme',
    text: 'Aynı ürün, sitelere göre değişen isimlendirmelere rağmen tek bir kayıtta birleştirilir.',
  },
  {
    title: 'Karşılaştırma',
    text: 'Güncel fiyatlar ucuzdan pahalıya sıralanır, en ucuz olan yeşil rozetle işaretlenir.',
  },
  {
    title: 'Takip',
    text: 'Fiyat geçmişi saklanır; düşüşler ve tüm zamanların en düşük fiyatı ürün sayfasında gösterilir.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="max-w-2xl">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Nasıl çalışır
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          FiyatKarşılaştır, satın alma kararınızı hızlandırmak için arka planda dört basit adım
          işletir.
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-xl border border-border bg-white p-5">
            <span className="font-mono text-sm font-semibold text-primary">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2 className="mt-2 font-heading text-base font-semibold text-text">{step.title}</h2>
            <p className="mt-1 text-sm text-muted">{step.text}</p>
          </li>
        ))}
      </ol>

      <p className="rounded-xl border border-border bg-surface-alt p-4 text-xs text-muted">
        Fiyatlar günde bir kez ilgili sitelerden otomatik derlenir; satın alma öncesi güncel fiyatı
        satıcı sitesinde doğrulayın.
      </p>
    </div>
  );
}
