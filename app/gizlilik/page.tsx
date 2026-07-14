import Link from 'next/link';
import LegalShell from '@/components/legal/LegalShell';

export const metadata = {
  title: 'Gizlilik Politikası',
  description: 'FiyatKarşılaştır hangi verileri toplar, nasıl kullanır ve nasıl korur.',
};

const UPDATED = '12 Temmuz 2026';
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function PrivacyPage() {
  return (
    <LegalShell title="Gizlilik Politikası" updated={UPDATED}>
      <p>
        FiyatKarşılaştır olarak gizliliğinize önem veriyoruz. Bu politika, hizmetimizi kullanırken
        hangi kişisel verileri topladığımızı, bunları neden ve nasıl işlediğimizi açıklar.
      </p>

      <h2>Topladığımız veriler</h2>
      <ul>
        <li>
          <strong>Hesap bilgileri:</strong> Kayıt olurken verdiğiniz e-posta adresi ve şifreniz.
          Şifreniz asla düz metin olarak saklanmaz; geri döndürülemez şekilde (PBKDF2 ile) özetlenir.
        </li>
        <li>
          <strong>Tercihleriniz:</strong> Favorilere eklediğiniz ürünler ve kurduğunuz fiyat
          alarmlarının hedef fiyatları.
        </li>
        <li>
          <strong>Teknik veriler:</strong> Oturumunuzu açık tutan zorunlu çerez ve olağan sunucu
          kayıtları (ör. hata ayıklama için IP ve tarayıcı bilgisi).
        </li>
      </ul>

      <h2>Verileri ne için kullanıyoruz</h2>
      <ul>
        <li>Hesabınızı oluşturmak ve oturumunuzu sürdürmek.</li>
        <li>Favori ve fiyat alarmı özelliklerini sağlamak.</li>
        <li>Bir ürünün fiyatı hedefinizin altına düştüğünde size bildirim e-postası göndermek.</li>
      </ul>

      <h2>Üçüncü taraflar</h2>
      <p>
        Fiyat verileri, mağazaların herkese açık ürün sayfalarından otomatik olarak derlenir; bu
        işlem sırasında kişisel verilerinizi mağazalarla paylaşmayız. Bildirim e-postalarını
        göndermek için bir e-posta altyapı sağlayıcısı kullanırız ve bu sağlayıcıya yalnızca
        e-postanın iletilmesi için gereken bilgiyi aktarırız. Verilerinizi pazarlama amacıyla üçüncü
        taraflara satmayız.
      </p>

      <h2>Çerezler</h2>
      <p>
        Yalnızca hizmetin çalışması için zorunlu çerezleri kullanırız. Ayrıntılar için{' '}
        <Link href="/cerez-politikasi">Çerez Politikası</Link> sayfasına bakın.
      </p>

      <h2>Haklarınız</h2>
      <p>
        6698 sayılı KVKK kapsamında verilerinize erişme, düzeltilmesini veya silinmesini isteme
        haklarına sahipsiniz. Ayrıntılı bilgi için <Link href="/kvkk">KVKK Aydınlatma Metni</Link>
        sayfasını inceleyebilirsiniz. Hesabınızın ve ilişkili tüm verilerin (favoriler, alarmlar)
        silinmesini talep edebilirsiniz.
      </p>

      <h2>Saklama süresi</h2>
      <p>Hesap verileriniz, siz silinmesini talep edene kadar saklanır.</p>

      <h2>İletişim</h2>
      <p>
        Gizlilikle ilgili sorularınız için{' '}
        {CONTACT ? <a href={`mailto:${CONTACT}`}>{CONTACT}</a> : 'site yöneticisiyle'} iletişime
        geçebilirsiniz.
      </p>
    </LegalShell>
  );
}
