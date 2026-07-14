import Link from 'next/link';
import LegalShell from '@/components/legal/LegalShell';

export const metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.',
};

const UPDATED = '12 Temmuz 2026';
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function KvkkPage() {
  return (
    <LegalShell title="KVKK Aydınlatma Metni" updated={UPDATED}>
      <p>
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca, veri
        sorumlusu sıfatıyla FiyatKarşılaştır tarafından hazırlanmıştır.
      </p>

      <h2>İşlenen kişisel veriler</h2>
      <ul>
        <li>Kimlik/iletişim: e-posta adresi.</li>
        <li>İşlem güvenliği: özetlenmiş (hash&apos;lenmiş) şifre, oturum çerezi, sunucu kayıtları.</li>
        <li>Kullanım tercihleri: favori ürünler ve fiyat alarmı hedefleri.</li>
      </ul>

      <h2>İşleme amaçları</h2>
      <ul>
        <li>Üyelik hesabının oluşturulması ve yönetilmesi.</li>
        <li>Talep ettiğiniz fiyat alarmı bildirimlerinin gönderilmesi.</li>
        <li>Hizmetin güvenliğinin ve sürekliliğinin sağlanması.</li>
      </ul>

      <h2>Hukuki sebep</h2>
      <p>
        Kişisel verileriniz; bir sözleşmenin (üyelik) kurulması ve ifası için gerekli olması, açık
        rızanız (fiyat alarmı e-postaları) ve veri sorumlusunun meşru menfaati (güvenlik) hukuki
        sebeplerine dayanılarak işlenir.
      </p>

      <h2>Aktarım</h2>
      <p>
        E-posta bildirimlerinin iletilmesi amacıyla yalnızca gerekli veriler bir e-posta altyapı
        hizmet sağlayıcısına aktarılır. Bunun dışında verileriniz üçüncü kişilerle paylaşılmaz.
      </p>

      <h2>Haklarınız (KVKK m. 11)</h2>
      <p>
        Kişisel verilerinizin işlenip işlenmediğini öğrenme; işlenmişse buna ilişkin bilgi talep
        etme; düzeltilmesini, silinmesini veya yok edilmesini isteme ve bu işlemlerin verilerin
        aktarıldığı üçüncü kişilere bildirilmesini isteme haklarına sahipsiniz.
      </p>

      <h2>Başvuru</h2>
      <p>
        Haklarınızı kullanmak için{' '}
        {CONTACT ? <a href={`mailto:${CONTACT}`}>{CONTACT}</a> : 'site yöneticisiyle'} iletişime
        geçebilirsiniz. Ayrıca <Link href="/gizlilik">Gizlilik Politikası</Link> sayfasını da
        inceleyebilirsiniz.
      </p>
    </LegalShell>
  );
}
