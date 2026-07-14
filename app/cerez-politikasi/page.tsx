import Link from 'next/link';
import LegalShell from '@/components/legal/LegalShell';

export const metadata = {
  title: 'Çerez Politikası',
  description: 'FiyatKarşılaştır hangi çerezleri ve yerel depolamayı neden kullanır.',
};

const UPDATED = '12 Temmuz 2026';

export default function CookiePolicyPage() {
  return (
    <LegalShell title="Çerez Politikası" updated={UPDATED}>
      <p>
        FiyatKarşılaştır yalnızca hizmetin çalışması için gerekli olan çerezleri kullanır. Reklam
        veya üçüncü taraf takip çerezi kullanmıyoruz.
      </p>

      <h2>Kullandığımız çerezler</h2>
      <ul>
        <li>
          <strong>fk_session</strong> — Giriş yaptığınızda oturumunuzu açık tutan zorunlu çerez.
          Yalnızca sunucu tarafından okunur (httpOnly).
        </li>
        <li>
          <strong>admin_session</strong> — Yalnızca site yöneticisinin yönetim paneline erişimi
          için kullanılan zorunlu çerez.
        </li>
      </ul>

      <h2>Tarayıcı yerel depolaması (localStorage)</h2>
      <p>
        Bazı özellikler için tarayıcınızın yerel depolamasını kullanırız; bu veriler cihazınızda
        kalır, sunucuya çerez olarak gönderilmez:
      </p>
      <ul>
        <li>Karşılaştırma listeniz (seçtiğiniz ürünler).</li>
        <li>Çerez bilgilendirmesini kapattığınıza dair tercih.</li>
      </ul>

      <h2>Çerezleri yönetme</h2>
      <p>
        Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz; ancak zorunlu çerezler
        engellenirse giriş gibi bazı özellikler çalışmayabilir.
      </p>

      <p>
        Daha fazla bilgi için <Link href="/gizlilik">Gizlilik Politikası</Link> sayfasına bakın.
      </p>
    </LegalShell>
  );
}
