// Fiyat alarmı kontrolü — tarama sonrası çağrılır (scrapers/run.ts). Güncel en
// ucuz fiyat hedefin altına düşen alarmlar için e-posta gönderir.
//
// Tekrar-bildirim kuralı: bir alarm hedefin altına düşünce BİR kez bildirilir
// (lastNotifiedAt işaretlenir). Fiyat hedefin üstüne çıkınca yeniden silahlanır
// (lastNotifiedAt sıfırlanır), böylece bir sonraki düşüşte tekrar bildirilir —
// fiyat düşük kaldığı sürece her taramada spam gönderilmez.

import { prisma } from './db';
import { sendEmail, emailButton, emailLayout } from './email';
import { formatPrice } from './normalize';
import { getCheapestPrices } from './queries';
import { siteUrl } from './seo';

export async function checkAndSendPriceAlerts(): Promise<{ checked: number; sent: number }> {
  const alerts = await prisma.priceAlert.findMany({
    select: {
      id: true,
      variantId: true,
      targetPrice: true,
      lastNotifiedAt: true,
      user: { select: { email: true } },
      variant: { select: { displayName: true } },
    },
  });
  if (alerts.length === 0) return { checked: 0, sent: 0 };

  const cheapest = await getCheapestPrices([...new Set(alerts.map((a) => a.variantId))]);
  let sent = 0;

  for (const alert of alerts) {
    const current = cheapest.get(alert.variantId);
    if (current == null) continue;
    const target = Number(alert.targetPrice);

    if (current > target) {
      // Hedefin üstüne çıktı — bir sonraki düşüş için yeniden silahla.
      if (alert.lastNotifiedAt != null) {
        await prisma.priceAlert.update({ where: { id: alert.id }, data: { lastNotifiedAt: null } });
      }
      continue;
    }

    // current <= target: yalnızca daha önce bildirilmediyse gönder.
    if (alert.lastNotifiedAt != null) continue;

    const url = siteUrl(`/urun/${alert.variantId}`);
    const name = alert.variant.displayName;
    try {
      await sendEmail({
        to: alert.user.email,
        subject: `Fiyat düştü: ${name}`,
        html: emailLayout(
          'Takip ettiğin ürünün fiyatı düştü 🎉',
          `<p style="font-size:14px;line-height:1.6;color:#334155;"><strong>${name}</strong> ürününün güncel en ucuz fiyatı <strong>${formatPrice(current)}</strong> — belirlediğin ${formatPrice(target)} hedefinin altında.</p>
           <p style="margin:22px 0;">${emailButton(url, 'Ürüne git')}</p>
           <p style="font-size:12px;color:#64748b;">Bu alarmı FiyatKarşılaştır hesabından kurmuştun. Alarmlarını yönetmek için ${siteUrl('/alarmlarim')} adresine gidebilirsin.</p>`,
        ),
        text: `${name} güncel en ucuz fiyatı ${formatPrice(current)} — hedefin ${formatPrice(target)} altında. ${url}`,
      });
      await prisma.priceAlert.update({ where: { id: alert.id }, data: { lastNotifiedAt: new Date() } });
      sent++;
    } catch (err) {
      console.warn(`  ⚠ Alarm e-postası gönderilemedi (${alert.user.email}): ${(err as Error).message}`);
    }
  }

  return { checked: alerts.length, sent };
}
