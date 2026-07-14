import Link from 'next/link';
import LegalShell from '@/components/legal/LegalShell';

export const metadata = {
  title: 'Kullanım Koşulları',
  description: 'FiyatKarşılaştır hizmetini kullanım koşulları.',
};

const UPDATED = '12 Temmuz 2026';

export default function TermsPage() {
  return (
    <LegalShell title="Kullanım Koşulları" updated={UPDATED}>
      <p>
        FiyatKarşılaştır&apos;ı kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.
      </p>

      <h2>Hizmetin niteliği</h2>
      <p>
        FiyatKarşılaştır, farklı mağazalardaki herkese açık ürün fiyatlarını derleyip karşılaştırma
        imkânı sunan bir bilgi hizmetidir. Bir satıcı değiliz; ürünler ilgili mağazalardan satın
        alınır.
      </p>

      <h2>Fiyat doğruluğu</h2>
      <p>
        Fiyatlar mağaza sayfalarından günde bir kez otomatik olarak derlenir ve gecikmeli ya da
        güncelliğini yitirmiş olabilir. Satın alma kararından önce güncel fiyatı, stok ve kargo
        bilgisini ilgili mağazanın kendi sayfasında doğrulamanız gerekir. Fiyatların doğruluğu
        konusunda garanti vermeyiz.
      </p>

      <h2>Bağlantılar ve ortaklık</h2>
      <p>
        Mağazalara giden bazı bağlantılar ortaklık (affiliate) bağlantısı olabilir; bu bağlantılar
        üzerinden yapılan alışverişlerden komisyon kazanabiliriz. Bu durum, gösterilen fiyatı veya
        sıralamayı sizin lehinize/aleyhinize değiştirmez.
      </p>

      <h2>Hesap sorumluluğu</h2>
      <p>
        Hesabınızın güvenliğinden ve şifrenizin gizliliğinden siz sorumlusunuz. Hizmeti hukuka
        aykırı veya sistemlere zarar verecek şekilde kullanmamayı kabul edersiniz.
      </p>

      <h2>Fikri mülkiyet</h2>
      <p>
        Marka adları ve ürün görselleri ilgili sahiplerine aittir ve yalnızca tanımlama/karşılaştırma
        amacıyla gösterilir.
      </p>

      <h2>Değişiklikler</h2>
      <p>
        Bu koşulları zaman zaman güncelleyebiliriz. Güncel sürüm bu sayfada yayımlanır. Ayrıca{' '}
        <Link href="/gizlilik">Gizlilik Politikası</Link> ve{' '}
        <Link href="/cerez-politikasi">Çerez Politikası</Link> sayfalarımızı inceleyebilirsiniz.
      </p>
    </LegalShell>
  );
}
